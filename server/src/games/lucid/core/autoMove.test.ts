import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { lineTrack } from '@/games/lucid/vitest/factories';
import { makeFallbackParty } from '@/games/lucid/vitest/factories';
import { chooseAutoMove } from '@/games/lucid/core/autoMove';

describe('chooseAutoMove', () => {
  it('в фазе броска бросает кубик', () => {
    const state = makeFallbackParty({ seed: 'auto-roll' });

    expect(chooseAutoMove(state)?.type).toBe(LucidShared.EMoveType.ROLL);
  });

  it('на финише открывает сейф без доплаты', () => {
    const state = makeFallbackParty({ seed: 'auto-safe' });
    const playerId = state.ctx.currentPlayer;
    state.G.players[playerId].position = state.G.track.finishId;

    expect(chooseAutoMove(state)).toEqual({
      type: LucidShared.EMoveType.OPEN_SAFE,
      playerId,
      stateId: state.stateId,
      bonus: 0,
    });
  });

  it('в фазе выбора кубика берёт первый', () => {
    const state = makeFallbackParty({ seed: 'auto-dice' });
    state.ctx.phase = LucidShared.EPhase.DICE;

    expect(chooseAutoMove(state)).toEqual({
      type: LucidShared.EMoveType.CHOOSE_DIE,
      playerId: state.ctx.currentPlayer,
      stateId: state.stateId,
      dieIndex: 0,
    });
  });

  it('в фазе развилки берёт первую доступную ветку', () => {
    const state = makeFallbackParty({ seed: 'auto-branch' });
    state.ctx.phase = LucidShared.EPhase.BRANCH;
    state.G.branchChoices = [4, 7];

    const move = chooseAutoMove(state);

    expect(move).toEqual({
      type: LucidShared.EMoveType.CHOOSE_BRANCH,
      playerId: state.ctx.currentPlayer,
      stateId: state.stateId,
      cellId: 4,
    });
  });

  it('в фазе выбора берёт первый вариант, который по карману', () => {
    const state = makeFallbackParty({ seed: 'auto-option' });
    const playerId = state.ctx.currentPlayer;
    state.G.track = lineTrack();
    state.G.players[playerId].position = 1;
    state.G.players[playerId].resource = 0;
    state.G.events = {
      1: {
        cellId: 1,
        title: 'Лавка',
        text: 'Дорого',
        options: [
          {
            text: 'Купить',
            cost: 3,
            success: {
              atoms: [{
                kind: LucidShared.EAtomKind.RESOURCE,
                target: LucidShared.ETarget.SELF,
                value: 1,
              }],
            },
          },
          {
            text: 'Посмотреть',
            success: {
              atoms: [{
                kind: LucidShared.EAtomKind.RESOURCE,
                target: LucidShared.ETarget.SELF,
                value: 1,
              }],
            },
          },
        ],
      },
    };
    state.ctx.phase = LucidShared.EPhase.CHOICE;

    // Первый вариант недоступен по цене: движок такой ход отклонит,
    // и автопилот зациклился бы, выбирая его снова и снова
    expect(chooseAutoMove(state)).toMatchObject({ optionIndex: 1 });
  });

  it('после конца партии ходить нечем', () => {
    const state = makeFallbackParty({ seed: 'auto-ended' });
    state.ctx.phase = LucidShared.EPhase.ENDED;

    expect(chooseAutoMove(state)).toBeNull();
  });
});
