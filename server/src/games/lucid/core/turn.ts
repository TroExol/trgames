import { LucidShared } from '@trgames/shared';

import { landOnCell } from '@/games/lucid/core/cells';
import { drawLaws } from '@/games/lucid/core/cards';

export const freshTurn = (): LucidShared.TTurn => ({
  step: LucidShared.ETurnStep.START,
  fired: [],
  extraTurn: false,
});

export const withTurn = (G: LucidShared.TG, patch: Partial<LucidShared.TTurn>): LucidShared.TG => ({
  ...G,
  turn: { ...G.turn, ...patch },
});

const withPhase = (state: LucidShared.TState, phase: LucidShared.EPhase): LucidShared.TState => ({
  ...state,
  ctx: { ...state.ctx, phase },
});

export const currentEvent = (G: LucidShared.TG, playerId: LucidShared.TPlayerId): LucidShared.TEvent | undefined =>
  G.turn.lawEvent ?? G.events[G.turn.eventCellId ?? G.players[playerId].position];

const isAffordable = (event: LucidShared.TEvent | undefined, player: LucidShared.TPlayer): boolean =>
  Boolean(event?.options.some(option => !option.cost || option.cost <= player.resource));

export const startTurn = (state: LucidShared.TState): LucidShared.TState =>
  proceed(withPhase({ ...state, G: { ...state.G, turn: freshTurn() } }, LucidShared.EPhase.ROLL));

export const nextTurn = (state: LucidShared.TState): LucidShared.TState => {
  const index = state.G.order.indexOf(state.ctx.currentPlayer);
  const currentPlayer = state.G.turn.extraTurn
    ? state.ctx.currentPlayer
    : state.G.order[(index + 1) % state.G.order.length];

  return startTurn({ ...state, ctx: { ...state.ctx, currentPlayer, turn: state.ctx.turn + 1 } });
};

export const land = (state: LucidShared.TState): LucidShared.TState => {
  const playerId = state.ctx.currentPlayer;
  const player = state.G.players[playerId];
  const G = withTurn(
    { ...state.G, branchChoices: [], pendingSteps: 0 },
    { step: LucidShared.ETurnStep.LANDED, landedCellId: player.position },
  );

  if (isAffordable(G.events[player.position], player)) {
    return withPhase({ ...state, G }, LucidShared.EPhase.CHOICE);
  }

  const cell = G.track.cells.find(item => item.id === player.position);

  if (cell?.type === LucidShared.ECellType.LAW) {
    const drawn = drawLaws(G, 2);

    if (drawn.cards.lawDraw.length > 0) {
      return withPhase({ ...state, G: drawn }, LucidShared.EPhase.LAW);
    }
  }

  return proceed({ ...state, G: landOnCell(G, playerId) });
};

export const proceed = (state: LucidShared.TState): LucidShared.TState => {
  switch (state.G.turn.step) {
    case LucidShared.ETurnStep.CARDS:
      return proceed({ ...state, G: withTurn(state.G, { step: LucidShared.ETurnStep.END }) });
    case LucidShared.ETurnStep.END:
      return nextTurn(state);
    case LucidShared.ETurnStep.LANDED:
      return proceed({ ...state, G: withTurn(state.G, { step: LucidShared.ETurnStep.CARDS }) });
    case LucidShared.ETurnStep.START:
      return withPhase(state, LucidShared.EPhase.ROLL);
  }
};
