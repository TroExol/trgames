import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { createStorage } from '@/games/lucid/storage/db';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';
import { setupParty } from '@/games/lucid/core/setup';
import { applyMove, EMoveType } from '@/games/lucid/core/reducer';
import { formatForPlayer } from '@/games/lucid/core/formatForPlayer';

const MAX_MOVES = 2000;

interface TPlayLog {
  state: LucidShared.TState;
  branchOffers: number;
}

// Бот: бросает кубик, на развилке берёт вторую ветку, в событии — первый
// вариант, который может себе позволить. Брать вариант вслепую нельзя:
// недоступный по цене движок отклонит, и бот выбирал бы его бесконечно
const playToEnd = (start: LucidShared.TState): TPlayLog => {
  let state = start;
  let branchOffers = 0;

  for (let i = 0; i < MAX_MOVES && state.ctx.phase !== LucidShared.EPhase.ENDED; i++) {
    const playerId = state.ctx.currentPlayer;
    const stateId = state.stateId;

    if (state.ctx.phase === LucidShared.EPhase.BRANCH) {
      branchOffers++;
      state = applyMove(state, {
        type: EMoveType.CHOOSE_BRANCH,
        playerId,
        stateId,
        cellId: state.G.branchChoices[1],
      });
      continue;
    }

    if (state.ctx.phase === LucidShared.EPhase.CHOICE) {
      const player = state.G.players[playerId];
      const options = state.G.events[player.position]?.options ?? [];
      const optionIndex = options.findIndex(option => !option.cost || option.cost <= player.resource);

      state = applyMove(state, { type: EMoveType.CHOOSE_OPTION, playerId, stateId, optionIndex });
      continue;
    }

    state = applyMove(state, { type: EMoveType.ROLL, playerId, stateId });
  }

  return { state, branchOffers };
};

const makeParty = (seed: string, playerCount = 3) => setupParty({
  seed,
  players: Array.from({ length: playerCount }, (_, index) => ({
    id: `p${index}`,
    nickname: `Игрок ${index}`,
  })),
  content: loadFallbackContent(),
});

describe('партия целиком', () => {
  it('на любом сиде и любом числе игроков доходит до победителя', () => {
    ['a', 'b', 'c', 'd', 'e'].forEach(seed => {
      [2, 3, 4, 5, 6].forEach(playerCount => {
        const { state } = playToEnd(makeParty(`${seed}-${playerCount}`, playerCount));

        expect(state.ctx.phase).toBe(LucidShared.EPhase.ENDED);
        expect(state.G.winner).toBeDefined();
      });
    });
  });

  it('за партию развилка предлагается не раз и не два', () => {
    // Если бы выбор ветки ждал точного попадания на клетку развилки,
    // предложений было бы в разы меньше
    expect(playToEnd(makeParty('branches')).branchOffers).toBeGreaterThan(3);
  });

  it('партия воспроизводима: тот же сид даёт того же победителя', () => {
    expect(playToEnd(makeParty('repeat')).state.G.winner)
      .toBe(playToEnd(makeParty('repeat')).state.G.winner);
  });

  it('партия переживает сохранение и загрузку посреди игры', () => {
    const storage = createStorage(':memory:');
    let state = makeParty('restart', 2);

    state = applyMove(state, {
      type: EMoveType.ROLL,
      playerId: state.ctx.currentPlayer,
      stateId: state.stateId,
    });
    storage.saveParty({ uuid: 'p1', theme: 'станция', state });

    const restored = storage.loadParty('p1')!;

    expect(restored).toEqual(state);
    expect(playToEnd(restored).state.ctx.phase).toBe(LucidShared.EPhase.ENDED);
  });

  it('в начале партии игрок не видит содержимого ни одной клетки событий', () => {
    expect(Object.keys(formatForPlayer(makeParty('secrets'), 'p0').G.events)).toHaveLength(0);
  });

  it('к концу партии открыто только то, где кто-то побывал', () => {
    const { state } = playToEnd(makeParty('opened'));
    const view = formatForPlayer(state, 'p0');

    Object.keys(view.G.events).forEach(cellId => {
      expect(state.G.visited).toContain(Number(cellId));
    });
    expect(Object.keys(view.G.events).length).toBeLessThan(state.G.track.cells.length);
  });
});
