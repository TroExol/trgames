import { LucidShared } from '@trgames/shared';

// @trgames/shared отдаёт этот тип только через неймспейс LucidShared,
// плоского реэкспорта не существует — извлекаем сами
export type TStateForPlayer = LucidShared.TStateForPlayer;

// Вариант глазами игрока: success/failure видны только по раскрытым веткам
// клетки. Без порога ветка одна — success, и раскрывается тем же способом:
// историей выбора этого варианта на этой клетке
const toOptionView = (
  option: LucidShared.TOption,
  history: LucidShared.THistoryEntry[],
  optionIndex: number,
): LucidShared.TOptionView => {
  const revealedSuccess = history.some(entry => entry.optionIndex === optionIndex && entry.branch === 'success');
  const revealedFailure = history.some(entry => entry.optionIndex === optionIndex && entry.branch === 'failure');

  return {
    text: option.text,
    threshold: option.threshold,
    cost: option.cost,
    revealed: { success: revealedSuccess, failure: revealedFailure },
    hint: LucidShared.buildOptionHint(option),
    success: revealedSuccess ? option.success : undefined,
    // Раскрытая, но отсутствующая failure остаётся undefined — «раскрыта,
    // пусто» клиент читает по revealed.failure, а не по наличию поля
    failure: revealedFailure ? option.failure : undefined,
  };
};

const toEventView = (
  event: LucidShared.TEvent,
  cellHistory: Record<number, LucidShared.THistoryEntry[]>,
): LucidShared.TEventView => ({
  cellId: event.cellId,
  title: event.title,
  text: event.text,
  options: event.options.map((option, index) => toOptionView(option, cellHistory[event.cellId] ?? [], index)),
});

const toOpenEventView = (event: LucidShared.TEvent): LucidShared.TEventView => ({
  cellId: event.cellId,
  title: event.title,
  text: event.text,
  options: event.options.map(option => ({
    text: option.text,
    threshold: option.threshold,
    cost: option.cost,
    revealed: { success: true, failure: Boolean(option.failure) },
    hint: LucidShared.buildOptionHint(option),
    success: option.success,
    failure: option.failure,
  })),
});

export const formatForPlayer = (
  state: LucidShared.TState,
  playerId: LucidShared.TPlayerId,
): TStateForPlayer => {
  const opened = Object.fromEntries(
    Object.entries(state.G.events)
      .filter(([cellId]) => state.G.visited.includes(Number(cellId)))
      .map(([cellId, event]) => [cellId, toEventView(event, state.G.cellHistory)]),
  );

  // Поля перечислены поимённо намеренно: это список разрешённого, а не запрещённого.
  // Новое поле в состоянии партии не уедет игроку само — оно вызовет ошибку сборки
  // здесь, и показывать его придётся решить осознанно. Так состояние генератора
  // случайных чисел не попадёт к игроку: зная его, он предсказал бы все броски.
  // Журнал партии тоже не отдаётся целиком — лента собирается из его прироста
  // на стороне комнаты (см. Party.takeRibbonDelta). events уходят в форме TEventView:
  // исход варианта виден только по раскрытым веткам (5.5)
  const G: LucidShared.TStateForPlayer['G'] = {
    players: state.G.players,
    order: state.G.order,
    track: state.G.track,
    events: opened,
    theme: state.G.theme,
    cardNames: state.G.cardNames,
    visited: state.G.visited,
    winner: state.G.winner,
    branchChoices: state.G.branchChoices,
    pendingSteps: state.G.pendingSteps,
    lastRoll: state.G.lastRoll,
    cellHistory: state.G.cellHistory,
    cards: {
      laws: state.G.cards.laws,
      lawDraw: state.G.cards.lawDraw,
      shopOffer: state.G.cards.shopOffer,
      hands: state.G.cards.hands,
    },
    turn: { ...state.G.turn, lawEvent: state.G.turn.lawEvent && toOpenEventView(state.G.turn.lawEvent) },
  };

  return {
    G,
    ctx: state.ctx,
    stateId: state.stateId,
    you: playerId,
  };
};
