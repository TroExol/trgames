import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import type { TPartySnapshot } from '@/games/lucid/room/Party';

import { createStorage } from '@/games/lucid/storage/db';
import { createPartyGroup } from '@/games/lucid/room/PartyGroup';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';
import { eventCellIds } from '@/games/lucid/core/track';
import { chooseAutoMove } from '@/games/lucid/core/autoMove';

const MAX_MOVES = 2000;

const playToEnd = (party: ReturnType<ReturnType<typeof createPartyGroup>['create']>) => {
  for (let i = 0; i < MAX_MOVES; i++) {
    const state = party.rawState();

    if (!state || state.ctx.phase === LucidShared.EPhase.ENDED) {
      return;
    }

    const move = chooseAutoMove(state);

    if (!move) {
      return;
    }

    party.applyMove(move);
  }
};

describe('партия через комнату', () => {
  const makeGroup = () => createPartyGroup({ storage: createStorage<TPartySnapshot>(':memory:') });

  const readyParty = (group: ReturnType<typeof makeGroup>, uuid: string, playerCount: number) => {
    const party = group.create({ uuid, ownerId: 'p0' });

    for (let index = 0; index < playerCount; index++) {
      party.join({ playerId: `p${index}`, nickname: `Игрок ${index}` });
    }

    party.proposeTheme('p0', 'заброшенная станция');

    return party;
  };

  it('от лобби до победителя при любом составе', async () => {
    for (const playerCount of [2, 3, 4, 5, 6]) {
      const group = makeGroup();
      const party = readyParty(group, `full-${playerCount}`, playerCount);

      await party.start({
        generate: ({ eventCellIds: cells, seed }) => Promise.resolve({
          content: loadFallbackContent(cells, seed),
          usedFallback: true,
        }),
      });

      playToEnd(party);

      expect(party.view('p0').phase).toBe(LucidShared.EPartyPhase.ENDED);
      expect(party.rawState()?.G.winner).toBeDefined();
    }
  });

  it('игрок не видит содержимого непройденных клеток', async () => {
    const group = makeGroup();
    const party = readyParty(group, 'secrets', 3);

    await party.start({
      generate: ({ eventCellIds: cells, seed }) => Promise.resolve({
        content: loadFallbackContent(cells, seed),
        usedFallback: true,
      }),
    });

    expect(Object.keys(party.view('p0').state!.G.events)).toHaveLength(0);
  });

  it('партия продолжается после перезапуска сервера', async () => {
    const storage = createStorage<TPartySnapshot>(':memory:');
    const group = createPartyGroup({ storage });
    const party = readyParty(group, 'restart', 3);

    await party.start({
      generate: ({ eventCellIds: cells, seed }) => Promise.resolve({
        content: loadFallbackContent(cells, seed),
        usedFallback: true,
      }),
    });

    const state = party.rawState()!;
    party.applyMove(chooseAutoMove(state)!);
    group.persist(party);

    const restored = createPartyGroup({ storage }).get('restart')!;
    playToEnd(restored);

    expect(restored.view('p0').phase).toBe(LucidShared.EPartyPhase.ENDED);
  });

  it('номера клеток событий совпадают с треком партии', async () => {
    const group = makeGroup();
    const party = readyParty(group, 'cells', 4);
    let requested: number[] = [];

    await party.start({
      generate: ({ eventCellIds: cells, seed }) => {
        requested = cells;

        return Promise.resolve({ content: loadFallbackContent(cells, seed), usedFallback: true });
      },
    });

    expect(requested).toEqual(eventCellIds(party.rawState()!.G.track));
  });

  it('после генерации потраченное на неё usage сохраняется в базу', async () => {
    const storage = createStorage<TPartySnapshot>(':memory:');
    const group = createPartyGroup({ storage });
    const party = readyParty(group, 'usage', 2);
    const usage = { inputTokens: 120, outputTokens: 340, costUsd: 0.045 };

    await party.start({
      generate: ({ eventCellIds: cells, seed }) => Promise.resolve({
        content: loadFallbackContent(cells, seed),
        usage,
        usedFallback: true,
      }),
    });
    // В init.ts персист после генерации тоже приходит отдельным вызовом,
    // уже после того, как start разрешился — здесь тот же порядок
    group.persist(party);

    expect(storage.totalUsage(party.uuid)).toEqual(usage);
  });
});
