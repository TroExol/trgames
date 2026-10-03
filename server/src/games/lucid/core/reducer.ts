import { LucidShared } from '@trgames/shared';

import { resolveOption } from '@/games/lucid/core/options';
import {
  openSafe,
  pickDie,
  rollAndMove,
  takeBranch,
} from '@/games/lucid/core/moves';
import { landOnCell } from '@/games/lucid/core/cells';

// @trgames/shared отдаёт эти типы только через неймспейс LucidShared,
// плоского реэкспорта не существует — извлекаем сами, чтобы обращения
// к EMoveType и TMove ниже по файлу и во внешних импортах не изменились
export const EMoveType = LucidShared.EMoveType;
export type EMoveType = LucidShared.EMoveType;
export type TMove = LucidShared.TMove;

// Каждый ход допустим ровно в одной фазе. После конца партии фаза ENDED,
// и ей не соответствует ни один ход
const PHASE_FOR_MOVE: Record<EMoveType, LucidShared.EPhase> = {
  [EMoveType.ROLL]: LucidShared.EPhase.ROLL,
  [EMoveType.CHOOSE_BRANCH]: LucidShared.EPhase.BRANCH,
  [EMoveType.CHOOSE_DIE]: LucidShared.EPhase.DICE,
  [EMoveType.CHOOSE_OPTION]: LucidShared.EPhase.CHOICE,
  [EMoveType.OPEN_SAFE]: LucidShared.EPhase.ROLL,
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

// Событие разыграно — ход на этом заканчивается. Проверять клетку заново нельзя:
// вариант мог не сдвинуть игрока, и то же событие предлагалось бы ему бесконечно
const endTurn = (state: LucidShared.TState): LucidShared.TState => {
  return { ...state, ctx: nextPlayer(state) };
};

const afterMove = (state: LucidShared.TState): LucidShared.TState => {
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

  const landed = { ...state, G: landOnCell(state.G, player.id) };

  return { ...landed, ctx: nextPlayer(landed) };
};

const isAtFinish = (state: LucidShared.TState, player: LucidShared.TPlayer): boolean =>
  player.position === state.G.track.finishId;

const skipTurn = (state: LucidShared.TState, player: LucidShared.TPlayer): LucidShared.TState => {
  const G: LucidShared.TG = {
    ...state.G,
    players: {
      ...state.G.players,
      [player.id]: { ...player, skipTurns: player.skipTurns - 1 },
    },
    log: [...state.G.log, `${player.nickname} пропускает ход`],
  };

  return { ...state, G, ctx: nextPlayer({ ...state, G }) };
};

const HANDLERS: Record<EMoveType, TMoveHandler> = {
  [EMoveType.ROLL]: state => {
    const player = state.G.players[state.ctx.currentPlayer];

    // У сейфа бросок на движение не нужен: только попытка открыть
    if (isAtFinish(state, player)) {
      return null;
    }

    // Пропуск хода тратится вместо броска
    if (player.skipTurns > 0) {
      return skipTurn(state, player);
    }

    const rolled = { ...state, G: rollAndMove(state.G, player.id) };

    if (rolled.G.lastRoll?.pending) {
      return { ...rolled, ctx: { ...rolled.ctx, phase: LucidShared.EPhase.DICE } };
    }

    return afterMove(rolled);
  },

  [EMoveType.OPEN_SAFE]: (state, move) => {
    if (move.type !== EMoveType.OPEN_SAFE) {
      return null;
    }

    const player = state.G.players[state.ctx.currentPlayer];
    const cost = Number.isInteger(move.bonus) ? LucidShared.SAFE_BONUS_COSTS[move.bonus] : undefined;

    if (cost === undefined || !isAtFinish(state, player)) {
      return null;
    }

    if (player.skipTurns > 0) {
      return skipTurn(state, player);
    }

    const G = openSafe(state.G, player.id, move.bonus);

    if (!G) {
      return null;
    }

    if (G.winner) {
      return { ...state, G, ctx: { ...state.ctx, phase: LucidShared.EPhase.ENDED } };
    }

    return { ...state, G, ctx: nextPlayer({ ...state, G }) };
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

  [EMoveType.CHOOSE_DIE]: (state, move) => {
    if (move.type !== EMoveType.CHOOSE_DIE) {
      return null;
    }

    const G = pickDie(state.G, state.ctx.currentPlayer, move.dieIndex);

    return G ? afterMove({ ...state, G }) : null;
  },

  [EMoveType.CHOOSE_OPTION]: (state, move) => {
    if (move.type !== EMoveType.CHOOSE_OPTION) {
      return null;
    }

    if (!Number.isInteger(move.optionIndex)) {
      return null;
    }

    const player = state.G.players[state.ctx.currentPlayer];
    const option = state.G.events[player.position]?.options[move.optionIndex];

    if (!option) {
      return null;
    }

    const G = resolveOption(state.G, player.id, move.optionIndex, option);

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

  if (!next) {
    return state;
  }

  const stateId = state.stateId + 1;
  // Новый объект lastRoll — признак свежего броска этим ходом (rollAndMove
  // и resolveOption всегда создают его заново, остальные пути ссылку не трогают).
  // Клетка stateId в нём — то, по чему клиент отличает новый бросок от
  // старого, даже если выпало то же самое число
  const G = next.G.lastRoll && next.G.lastRoll !== state.G.lastRoll
    ? { ...next.G, lastRoll: { ...next.G.lastRoll, stateId } }
    : next.G;

  return { ...next, G, stateId };
};
