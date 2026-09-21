import { LucidShared } from '@trgames/shared';

import { resolveOption } from '@/games/lucid/core/options';
import { rollAndMove, takeBranch } from '@/games/lucid/core/moves';

export enum EMoveType {
  CHOOSE_BRANCH = 'CHOOSE_BRANCH',
  CHOOSE_OPTION = 'CHOOSE_OPTION',
  ROLL = 'ROLL',
}

export type TMove =
  | { type: EMoveType.ROLL; playerId: LucidShared.TPlayerId; stateId: number }
  | {
    type: EMoveType.CHOOSE_BRANCH;
    playerId: LucidShared.TPlayerId;
    stateId: number;
    cellId: number;
  }
  | {
    type: EMoveType.CHOOSE_OPTION;
    playerId: LucidShared.TPlayerId;
    stateId: number;
    optionIndex: number;
  };

// Каждый ход допустим ровно в одной фазе. После конца партии фаза ENDED,
// и ей не соответствует ни один ход
const PHASE_FOR_MOVE: Record<EMoveType, LucidShared.EPhase> = {
  [EMoveType.ROLL]: LucidShared.EPhase.ROLL,
  [EMoveType.CHOOSE_BRANCH]: LucidShared.EPhase.BRANCH,
  [EMoveType.CHOOSE_OPTION]: LucidShared.EPhase.CHOICE,
};

// null означает «ход невозможен»: состояние остаётся прежним
type TMoveHandler = (state: LucidShared.TState, move: TMove) => LucidShared.TState | null;

const nextPlayer = (state: LucidShared.TState): LucidShared.TCtx => {
  const index = state.G.order.indexOf(state.ctx.currentPlayer);

  return {
    ...state.ctx,
    currentPlayer: state.G.order[(index + 1) % state.G.order.length],
    turn: state.ctx.turn + 1,
    phase: LucidShared.EPhase.ROLL,
  };
};

// После перемещения: либо конец партии, либо выбор ветки, либо событие, либо ход дальше
const finishIfWon = (state: LucidShared.TState): LucidShared.TState | null => {
  const winner = state.G.order.find(id => state.G.players[id].position >= state.G.track.finishId);

  if (!winner) {
    return null;
  }

  return {
    ...state,
    G: { ...state.G, winner, branchChoices: [], pendingSteps: 0 },
    ctx: { ...state.ctx, phase: LucidShared.EPhase.ENDED },
  };
};

// Событие разыграно — ход на этом заканчивается. Проверять клетку заново нельзя:
// вариант мог не сдвинуть игрока, и то же событие предлагалось бы ему бесконечно
const endTurn = (state: LucidShared.TState): LucidShared.TState => {
  return finishIfWon(state) ?? { ...state, ctx: nextPlayer(state) };
};

const afterMove = (state: LucidShared.TState): LucidShared.TState => {
  const won = finishIfWon(state);

  if (won) {
    return won;
  }

  if (state.G.branchChoices.length > 1) {
    return { ...state, ctx: { ...state.ctx, phase: LucidShared.EPhase.BRANCH } };
  }

  const player = state.G.players[state.ctx.currentPlayer];
  const event = state.G.events[player.position];
  // Вариант, который игроку не по карману, выбрать нельзя. Если таковы все варианты,
  // выбирать не из чего и событие проходит мимо: иначе у игрока не осталось бы
  // ни одного допустимого хода и партия встала бы намертво
  const affordable = event?.options.some(option => !option.cost || option.cost <= player.resource);

  if (affordable) {
    return { ...state, ctx: { ...state.ctx, phase: LucidShared.EPhase.CHOICE } };
  }

  return { ...state, ctx: nextPlayer(state) };
};

const HANDLERS: Record<EMoveType, TMoveHandler> = {
  [EMoveType.ROLL]: state => {
    const player = state.G.players[state.ctx.currentPlayer];

    // Пропуск хода тратится вместо броска
    if (player.skipTurns > 0) {
      const G: LucidShared.TG = {
        ...state.G,
        players: {
          ...state.G.players,
          [player.id]: { ...player, skipTurns: player.skipTurns - 1 },
        },
        log: [...state.G.log, `${player.nickname} пропускает ход`],
      };

      return { ...state, G, ctx: nextPlayer({ ...state, G }) };
    }

    return afterMove({ ...state, G: rollAndMove(state.G, player.id) });
  },

  [EMoveType.CHOOSE_BRANCH]: (state, move) => {
    if (move.type !== EMoveType.CHOOSE_BRANCH || !state.G.branchChoices.includes(move.cellId)) {
      return null;
    }

    return afterMove({
      ...state,
      G: takeBranch(state.G, state.ctx.currentPlayer, move.cellId),
    });
  },

  [EMoveType.CHOOSE_OPTION]: (state, move) => {
    if (move.type !== EMoveType.CHOOSE_OPTION) {
      return null;
    }

    const player = state.G.players[state.ctx.currentPlayer];
    const option = state.G.events[player.position]?.options[move.optionIndex];

    if (!option) {
      return null;
    }

    const G = resolveOption(state.G, player.id, option);

    // Вариант недоступен, например не хватает ресурса: ход не состоялся,
    // игрок не теряет право выбрать другой
    if (!G) {
      return null;
    }

    return endTurn({ ...state, G: { ...G, branchChoices: [], pendingSteps: 0 } });
  },
};

export const applyMove = (state: LucidShared.TState, move: TMove): LucidShared.TState => {
  // Устаревшая версия состояния: клиент отстал, ход игнорируем
  if (move.stateId !== state.stateId) {
    return state;
  }
  if (state.ctx.phase !== PHASE_FOR_MOVE[move.type]) {
    return state;
  }
  if (move.playerId !== state.ctx.currentPlayer) {
    return state;
  }

  const next = HANDLERS[move.type](state, move);

  return next ? { ...next, stateId: state.stateId + 1 } : state;
};
