import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeFallbackParty } from '@/games/lucid/vitest/factories';
import { createStorage } from '@/games/lucid/storage/db';
import { applyMove, EMoveType } from '@/games/lucid/core/reducer';
import { formatForPlayer } from '@/games/lucid/core/formatForPlayer';
import { chooseAutoMove } from '@/games/lucid/core/autoMove';

const MAX_MOVES = 2000;

interface TPlayLog {
  state: LucidShared.TState;
  branchOffers: number;
  choiceOffers: number;
}

// Ход выбирает та же функция, что и автопилот за отсутствующего игрока
// (chooseAutoMove): кубик, на развилке — первая доступная ветка, в событии —
// первый вариант, который по карману. Брать вариант вслепую нельзя:
// недоступный по цене движок отклонит, и перебор зациклился бы
const playToEnd = (start: LucidShared.TState): TPlayLog => {
  let state = start;
  let branchOffers = 0;
  let choiceOffers = 0;

  for (let i = 0; i < MAX_MOVES && state.ctx.phase !== LucidShared.EPhase.ENDED; i++) {
    if (state.ctx.phase === LucidShared.EPhase.BRANCH) {
      branchOffers++;
    }

    if (state.ctx.phase === LucidShared.EPhase.CHOICE) {
      choiceOffers++;
    }

    const move = chooseAutoMove(state);

    if (!move) {
      break;
    }

    state = applyMove(state, move);
  }

  return { state, branchOffers, choiceOffers };
};

const makeParty = (seed: string, playerCount = 3) => makeFallbackParty({ seed, playerCount });

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

  it('за партию выбор варианта события предлагается не раз и не два', () => {
    // Запасная партия могла бы выродиться в поле без единого события — этот
    // счётчик за такое бы поручился. Порог 10 взят с запасом: у события есть
    // варианты почти всегда (см. fallback.test.ts), значит выбор предлагается
    // почти на каждом ходу, а до победителя обычно десятки ходов
    expect(playToEnd(makeParty('choices')).choiceOffers).toBeGreaterThan(10);
  });

  it('партия воспроизводима: тот же сид даёт того же победителя', () => {
    expect(playToEnd(makeParty('repeat')).state.G.winner)
      .toBe(playToEnd(makeParty('repeat')).state.G.winner);
  });

  it('партия переживает сохранение и загрузку посреди игры', () => {
    const storage = createStorage<LucidShared.TState>(':memory:');
    let state = makeParty('restart', 2);

    state = applyMove(state, {
      type: EMoveType.ROLL,
      playerId: state.ctx.currentPlayer,
      stateId: state.stateId,
    });
    storage.saveParty({ uuid: 'p1', theme: 'станция', document: state });

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
