import { LucidShared } from '@trgames/shared';

import type { TLawRun, TLawTiming } from '@/games/lucid/core/lawEffects';

import { runLaws } from '@/games/lucid/core/lawEffects';
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

const applyPause = (state: LucidShared.TState, run: TLawRun): LucidShared.TState | null => {
  const next = { ...state, G: run.G };

  switch (run.pause?.kind) {
    case 'EVENT':
      return withPhase({ ...next, G: withTurn(next.G, { eventCellId: run.pause.cellId }) }, LucidShared.EPhase.CHOICE);
    case 'LAND':
      return land(next);
    case 'LAW_EVENT':
      return withPhase({ ...next, G: withTurn(next.G, { lawEvent: run.pause.event }) }, LucidShared.EPhase.CHOICE);
    default:
      return null;
  }
};

const settle = (
  state: LucidShared.TState,
  timing: TLawTiming,
  onClear: (state: LucidShared.TState) => LucidShared.TState,
): LucidShared.TState => {
  const run = runLaws(state.G, state.ctx.currentPlayer, timing);

  return applyPause(state, run) ?? onClear({ ...state, G: run.G });
};

export const startTurn = (state: LucidShared.TState): LucidShared.TState =>
  proceed(withPhase({ ...state, G: { ...state.G, turn: freshTurn() } }, LucidShared.EPhase.ROLL));

export const nextTurn = (state: LucidShared.TState): LucidShared.TState => {
  const index = state.G.order.indexOf(state.ctx.currentPlayer);
  const currentPlayer = state.G.turn.extraTurn
    ? state.ctx.currentPlayer
    : state.G.order[(index + 1) % state.G.order.length];

  return startTurn({ ...state, ctx: { ...state.ctx, currentPlayer, turn: state.ctx.turn + 1 } });
};

const landOn = (state: LucidShared.TState): LucidShared.TState => {
  const playerId = state.ctx.currentPlayer;
  const player = state.G.players[playerId];
  const { G } = state;

  if (isAffordable(G.events[player.position], player)) {
    return withPhase(state, LucidShared.EPhase.CHOICE);
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

export const land = (state: LucidShared.TState): LucidShared.TState => {
  const player = state.G.players[state.ctx.currentPlayer];
  const G = withTurn(
    { ...state.G, branchChoices: [], pendingSteps: 0 },
    { step: LucidShared.ETurnStep.LANDED, landedCellId: player.position },
  );
  const landed = { ...state, G };

  if (G.turn.from === undefined) {
    return landOn(landed);
  }

  const run = runLaws(G, state.ctx.currentPlayer, 'ROLLED');
  const cleared = { ...landed, G: withTurn(run.G, { from: undefined }) };

  return applyPause(cleared, { ...run, G: cleared.G }) ?? landOn(cleared);
};

export const proceed = (state: LucidShared.TState): LucidShared.TState => {
  switch (state.G.turn.step) {
    case LucidShared.ETurnStep.CARDS:
      return proceed({ ...state, G: withTurn(state.G, { step: LucidShared.ETurnStep.END }) });
    case LucidShared.ETurnStep.END:
      return settle(state, 'END', nextTurn);
    case LucidShared.ETurnStep.LANDED:
      return settle(state, 'LANDED', next => proceed({
        ...next,
        G: withTurn(next.G, { step: LucidShared.ETurnStep.CARDS }),
      }));
    case LucidShared.ETurnStep.START:
      return settle(state, 'START', next => withPhase(next, LucidShared.EPhase.ROLL));
  }
};
