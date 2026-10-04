import { LucidShared } from '@trgames/shared';

import { makeFallbackParty } from '@/games/lucid/vitest/factories';
import { currentEvent } from '@/games/lucid/core/turn';
import { applyMove } from '@/games/lucid/core/reducer';
import { chooseAutoMove } from '@/games/lucid/core/autoMove';

const { EPhase, EMoveType } = LucidShared;

type TState = LucidShared.TState;
type TMove = LucidShared.TMove;

export type TSimulationMode = 'ablate' | 'base' | 'cards' | 'skill';

export const SIMULATION_MODES: TSimulationMode[] = ['base', 'skill', 'ablate', 'cards'];

type TStrategy =
  | 'auto'
  | 'casual'
  | 'hinted'
  | 'noCards'
  | 'optOracle'
  | 'optWorst'
  | 'oracle'
  | 'random'
  | 'smart'
  | `phaseSmart:${LucidShared.EPhase}`;

interface TSimulationParams {
  mode: TSimulationMode;
  count: number;
  events?: LucidShared.TEvent[];
}

interface TPartyStats {
  winnerIndex: number;
  turnsPerPlayer: number;
  decisions: number;
  realDecisions: number;
  phaseCounts: Record<string, number>;
  phaseReal: Record<string, number>;
  leadChanges: number;
  leaderAtHalfWon: boolean;
  lastAtHalfWon: boolean;
  safeAttempts: number;
  firstArrivalWon: boolean;
  turnsAtSafeWinner: number;
  resourceSamples: number[];
  lowResourceShare: number;
  depthGapAtEnd: number;
}

const RANDOM_MULTIPLIER = 1103515245;
const RANDOM_INCREMENT = 12345;
const RANDOM_MASK = 0x7fffffff;
const SEED_RANGE = 4294967295;
const MAX_PARTY_MOVES = 8000;
const MAX_ROLLOUT_MOVES = 40;
const ROLLOUT_COUNT = 6;
const LOW_RESOURCE = 3;
const RESOURCE_SAMPLE_STEP = 5;
const SAFE_BONUSES = [0, 1, 2];
const DICE_INDEXES = [0, 1];
const LAW_INDEXES = [0, 1];
const OPTION_INDEXES = [0, 1, 2];
const ABLATED_PHASES = [EPhase.DICE, EPhase.BRANCH, EPhase.SHOP, EPhase.CARDS, EPhase.LAW, EPhase.ROLL];

let randomState = 12345;
let depthCache = new WeakMap<object, Record<number, number>>();
let generatedEvents: LucidShared.TEvent[] = [];

const random = (): number => {
  randomState = (randomState * RANDOM_MULTIPLIER + RANDOM_INCREMENT) & RANDOM_MASK;

  return randomState / RANDOM_MASK;
};

const average = (values: number[]): number =>
  Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;

const candidateMoves = (state: TState): TMove[] => {
  const playerId = state.ctx.currentPlayer;
  const base = { playerId, stateId: state.stateId };
  const hand = state.G.cards.hands[playerId] ?? [];

  switch (state.ctx.phase) {
    case EPhase.BRANCH:
      return state.G.branchChoices.map((cellId): TMove => ({ ...base, type: EMoveType.CHOOSE_BRANCH, cellId }));
    case EPhase.CARDS: {
      const moves: TMove[] = [{ ...base, type: EMoveType.END_TURN }];

      hand.forEach(item => {
        moves.push({ ...base, type: EMoveType.PLAY_CARD, uid: item.uid });
        state.G.order
          .filter(targetId => targetId !== playerId)
          .forEach(targetId => moves.push({ ...base, type: EMoveType.PLAY_CARD, uid: item.uid, targetId }));
      });

      return moves;
    }
    case EPhase.CHOICE: {
      const options = currentEvent(state.G, playerId)?.options ?? [];
      const others = state.G.order.filter(id => id !== playerId);

      return OPTION_INDEXES.flatMap((optionIndex): TMove[] => {
        const option = options[optionIndex];

        if (option && LucidShared.optionNeedsTarget(option)) {
          return others.map((targetId): TMove => ({ ...base, type: EMoveType.CHOOSE_OPTION, optionIndex, targetId }));
        }

        return [{ ...base, type: EMoveType.CHOOSE_OPTION, optionIndex }];
      });
    }
    case EPhase.DICE:
      return DICE_INDEXES.map((dieIndex): TMove => ({ ...base, type: EMoveType.CHOOSE_DIE, dieIndex }));
    case EPhase.LAW:
      return LAW_INDEXES.map((index): TMove => ({ ...base, type: EMoveType.CHOOSE_LAW, index }));
    case EPhase.ROLL:
      return [
        { ...base, type: EMoveType.ROLL },
        ...SAFE_BONUSES.map((bonus): TMove => ({ ...base, type: EMoveType.OPEN_SAFE, bonus })),
      ];
    case EPhase.SHOP: {
      const moves: TMove[] = [{ ...base, type: EMoveType.BUY_CARD, index: null }];

      state.G.cards.shopOffer.forEach((_, index) => {
        if (hand.length >= LucidShared.HAND_LIMIT) {
          hand.forEach(item => moves.push({ ...base, type: EMoveType.BUY_CARD, index, discardUid: item.uid }));
        } else {
          moves.push({ ...base, type: EMoveType.BUY_CARD, index });
        }
      });

      return moves;
    }
    default:
      return [];
  }
};

const legalMoves = (state: TState): TMove[] => candidateMoves(state).filter(move => applyMove(state, move) !== state);

const depthsOf = (state: TState): Record<number, number> => {
  const cached = depthCache.get(state.G.track);

  if (cached) {
    return cached;
  }

  const depths = LucidShared.trackDepths(state.G.track);

  depthCache.set(state.G.track, depths);

  return depths;
};

const maxDepth = (state: TState): number => depthsOf(state)[state.G.track.finishId];

const depthOf = (state: TState, playerId: string): number => depthsOf(state)[state.G.players[playerId].position];

const playerScore = (state: TState, playerId: string): number => {
  if (state.G.winner === playerId) {
    return 10000;
  }

  const player = state.G.players[playerId];
  const finishBonus = player.position === state.G.track.finishId ? 8 : 0;
  const handSize = state.G.cards.hands[playerId]?.length ?? 0;

  return depthOf(state, playerId)
    + finishBonus
    + player.resource * 0.35
    + handSize * 2
    - player.skipTurns * 4
    - (player.cursed ?? 0) * 3;
};

const relativeScore = (state: TState, playerId: string): number => {
  if (state.G.winner && state.G.winner !== playerId) {
    return -10000;
  }

  const rivals = state.G.order.filter(id => id !== playerId).map(id => playerScore(state, id));
  const best = Math.max(...rivals);
  const mean = rivals.reduce((sum, score) => sum + score, 0) / rivals.length;

  return playerScore(state, playerId) - best * 0.5 - mean * 0.5;
};

const reseed = (state: TState): TState => ({
  ...state,
  G: { ...state.G, random: { seed: Math.floor(random() * SEED_RANGE) >>> 0 } },
});

const rolloutTurn = (state: TState, playerId: string): TState => {
  let current = state;

  for (let step = 0; step < MAX_ROLLOUT_MOVES; step++) {
    if (current.ctx.phase === EPhase.ENDED || current.ctx.currentPlayer !== playerId) {
      return current;
    }

    const move = chooseAutoMove(current);

    if (!move) {
      return current;
    }

    const next = applyMove(current, move);

    if (next === current) {
      return current;
    }

    current = next;
  }

  return current;
};

const rolloutValue = (state: TState, move: TMove, playerId: string): number => {
  let value = 0;

  for (let rollout = 0; rollout < ROLLOUT_COUNT; rollout++) {
    value += relativeScore(rolloutTurn(applyMove(reseed(state), move), playerId), playerId);
  }

  return value;
};

const smartMove = (state: TState, seesOutcomes: boolean): TMove | null => {
  const playerId = state.ctx.currentPlayer;
  const moves = legalMoves(state);

  if (moves.length <= 1) {
    return moves[0] ?? null;
  }

  if (state.ctx.phase === EPhase.CHOICE && !seesOutcomes) {
    const event = state.G.turn.lawEvent
      ?? state.G.events[state.G.turn.eventCellId ?? state.G.players[playerId].position];
    const thresholdOf = (move: TMove): number =>
      (move.type === EMoveType.CHOOSE_OPTION ? event?.options[move.optionIndex]?.threshold : undefined) ?? 1;
    const sorted = [...moves].sort((first, second) => thresholdOf(first) - thresholdOf(second));

    return sorted[Math.floor(random() * Math.min(2, sorted.length))];
  }

  let best = moves[0];
  let bestValue = -Infinity;

  for (const move of moves) {
    const value = rolloutValue(state, move, playerId);

    if (value > bestValue) {
      bestValue = value;
      best = move;
    }
  }

  return best;
};

const chosenStance = (option: LucidShared.TOption): number => {
  const hint = LucidShared.buildOptionHint(option);

  return [...hint.success, ...hint.failure]
    .filter(item => item.target === LucidShared.ETarget.CHOSEN)
    .reduce((sum, item) => sum + (item.kind === LucidShared.EAtomKind.SKIP_TURN ? -1 : item.sign ?? 0), 0);
};

const aimAtTarget = (state: TState, move: TMove | null): TMove | null => {
  if (move?.type !== EMoveType.CHOOSE_OPTION) {
    return move;
  }

  const option = currentEvent(state.G, move.playerId)?.options[move.optionIndex];

  if (!option || !LucidShared.optionNeedsTarget(option)) {
    return move;
  }

  const byDepth = state.G.order
    .filter(id => id !== move.playerId)
    .sort((first, second) => depthOf(state, second) - depthOf(state, first));

  return { ...move, targetId: chosenStance(option) < 0 ? byDepth[0] : byDepth[byDepth.length - 1] };
};

const randomMove = (state: TState): TMove | null => {
  const moves = legalMoves(state);

  return moves.length ? moves[Math.floor(random() * moves.length)] : null;
};

const casualMove = (state: TState): TMove | null => {
  const moves = legalMoves(state);

  if (!moves.length) {
    return null;
  }

  if (state.ctx.phase === EPhase.SHOP) {
    return moves.find(move => move.type === EMoveType.BUY_CARD && move.index !== null) ?? moves[0];
  }

  if (state.ctx.phase === EPhase.CHOICE) {
    const optionOf = (move: TMove): number | undefined => (
      move.type === EMoveType.CHOOSE_OPTION ? move.optionIndex : undefined
    );
    const distinct = moves.filter((move, index) => (
      optionOf(move) === undefined || moves.findIndex(other => optionOf(other) === optionOf(move)) === index
    ));

    return aimAtTarget(state, distinct[Math.floor(random() * distinct.length)]);
  }

  if (state.ctx.phase === EPhase.CARDS) {
    return moves.find(move => move.type === EMoveType.PLAY_CARD) ?? moves[0];
  }

  if (state.ctx.phase === EPhase.DICE) {
    const [first = 0, second = 0] = state.G.lastRoll?.values ?? [];
    const best = first >= second ? 0 : 1;

    return moves.find(move => move.type === EMoveType.CHOOSE_DIE && move.dieIndex === best) ?? moves[0];
  }

  if (state.ctx.phase === EPhase.ROLL && state.G.players[state.ctx.currentPlayer].position === state.G.track.finishId) {
    return moves[moves.length - 1];
  }

  return moves[Math.floor(random() * moves.length)];
};

const D6_FACES = 6;

const hintWeight = (items: LucidShared.THintItem[]): number => items.reduce((sum, item) => {
  if (item.target === LucidShared.ETarget.SELF) {
    if (item.kind === LucidShared.EAtomKind.SKIP_TURN) {
      return sum - 1;
    }

    return sum + (item.sign ?? 0);
  }

  return item.sign === -1 ? sum + 0.5 : sum;
}, 0);

const hintedMove = (state: TState): TMove | null => {
  if (state.ctx.phase !== EPhase.CHOICE) {
    return casualMove(state);
  }

  const event = state.G.turn.lawEvent
    ?? state.G.events[state.G.turn.eventCellId ?? state.G.players[state.ctx.currentPlayer].position];
  const optionValue = (option: LucidShared.TOption): number => {
    const hint = LucidShared.buildOptionHint(option);
    const success = hintWeight(hint.success);

    if (!option.threshold) {
      return success;
    }

    const chance = Math.max(0, Math.min(D6_FACES, D6_FACES - option.threshold + 1)) / D6_FACES;

    return chance * success + (1 - chance) * hintWeight(hint.failure);
  };
  let best: TMove | null = null;
  let bestValue = -Infinity;

  for (const move of legalMoves(state)) {
    const option = move.type === EMoveType.CHOOSE_OPTION ? event?.options[move.optionIndex] : undefined;
    const value = option ? optionValue(option) : -Infinity;

    if (!best || value > bestValue) {
      best = move;
      bestValue = value;
    }
  }

  return aimAtTarget(state, best);
};

const refuseShopMove = (state: TState): TMove | null =>
  state.ctx.phase === EPhase.SHOP
    ? legalMoves(state).find(move => move.type === EMoveType.BUY_CARD && move.index === null) ?? null
    : casualMove(state);

const worstOptionMove = (state: TState): TMove | null => {
  if (state.ctx.phase !== EPhase.CHOICE) {
    return casualMove(state);
  }

  const playerId = state.ctx.currentPlayer;
  let worst: TMove | null = null;
  let worstValue = Infinity;

  for (const move of legalMoves(state)) {
    const value = rolloutValue(state, move, playerId);

    if (value < worstValue) {
      worstValue = value;
      worst = move;
    }
  }

  return worst;
};

const chooseMove = (strategy: TStrategy, state: TState): TMove | null => {
  if (strategy.startsWith('phaseSmart:')) {
    return strategy === `phaseSmart:${state.ctx.phase}` ? smartMove(state, true) : casualMove(state);
  }

  switch (strategy) {
    case 'auto':
      return chooseAutoMove(state);
    case 'hinted':
      return hintedMove(state);
    case 'noCards':
      return refuseShopMove(state);
    case 'optOracle':
      return state.ctx.phase === EPhase.CHOICE ? smartMove(state, true) : casualMove(state);
    case 'optWorst':
      return worstOptionMove(state);
    case 'oracle':
      return smartMove(state, true);
    case 'random':
      return randomMove(state);
    case 'smart':
      return smartMove(state, false);
    default:
      return casualMove(state);
  }
};

const makeParty = (seed: string, playerCount: number): TState => {
  const party = makeFallbackParty({ seed, playerCount });

  if (!generatedEvents.length) {
    return party;
  }

  const cellIds = Object.keys(party.G.events).map(Number);
  const offset = Math.floor(random() * generatedEvents.length);
  const events = Object.fromEntries(
    cellIds.map((cellId, index) => [cellId, { ...generatedEvents[(offset + index) % generatedEvents.length], cellId }]),
  );

  return { ...party, G: { ...party.G, events } };
};

const increment = (counts: Record<string, number>, key: string): void => {
  counts[key] = (counts[key] ?? 0) + 1;
};

const playParty = (seed: string, strategies: TStrategy[]): TPartyStats => {
  let state = makeParty(seed, strategies.length);

  depthCache = new WeakMap();

  const stats: TPartyStats = {
    winnerIndex: -1,
    turnsPerPlayer: 0,
    decisions: 0,
    realDecisions: 0,
    phaseCounts: {},
    phaseReal: {},
    leadChanges: 0,
    leaderAtHalfWon: false,
    lastAtHalfWon: false,
    safeAttempts: 0,
    firstArrivalWon: false,
    turnsAtSafeWinner: 0,
    resourceSamples: [],
    lowResourceShare: 0,
    depthGapAtEnd: 0,
  };
  const arrivedTurn: Record<string, number> = {};
  let leader: string | null = null;
  let halfLeader: string | null = null;
  let halfLast: string | null = null;
  let firstArrival: string | null = null;
  let lowResource = 0;
  let sampled = 0;

  for (let step = 0; state.ctx.phase !== EPhase.ENDED; step++) {
    if (step > MAX_PARTY_MOVES) {
      throw new Error(`Партия ${seed} зависла`);
    }

    const playerId = state.ctx.currentPlayer;

    stats.decisions++;
    increment(stats.phaseCounts, state.ctx.phase);

    if (legalMoves(state).length > 1) {
      stats.realDecisions++;
      increment(stats.phaseReal, state.ctx.phase);
    }

    if (state.ctx.phase === EPhase.ROLL && state.G.players[playerId].position === state.G.track.finishId) {
      stats.safeAttempts++;
    }

    const move = chooseMove(strategies[state.G.order.indexOf(playerId)], state);

    if (!move) {
      throw new Error(`Нет хода в партии ${seed}, фаза ${state.ctx.phase}`);
    }

    const next = applyMove(state, move);

    if (next === state) {
      throw new Error(`Ход отклонён: фаза ${state.ctx.phase}, ${JSON.stringify(move)}`);
    }

    state = next;

    const depths = state.G.order.map(id => depthOf(state, id));
    const deepest = Math.max(...depths);
    const currentLeader: string | null = depths.filter(depth => depth === deepest).length === 1
      ? state.G.order[depths.indexOf(deepest)]
      : leader;

    if (currentLeader !== leader && leader !== null) {
      stats.leadChanges++;
    }

    leader = currentLeader;

    if (!halfLeader && deepest >= maxDepth(state) / 2) {
      halfLeader = leader;
      halfLast = state.G.order[depths.indexOf(Math.min(...depths))];
    }

    for (const id of state.G.order) {
      if (state.G.players[id].position === state.G.track.finishId && arrivedTurn[id] === undefined) {
        arrivedTurn[id] = state.ctx.turn;
        firstArrival ??= id;
      }
    }

    if (step % RESOURCE_SAMPLE_STEP === 0) {
      for (const id of state.G.order) {
        sampled++;
        stats.resourceSamples.push(state.G.players[id].resource);

        if (state.G.players[id].resource < LOW_RESOURCE) {
          lowResource++;
        }
      }
    }
  }

  const winnerId = state.G.winner!;
  const finalDepths = state.G.order.map(id => depthOf(state, id)).sort((first, second) => second - first);

  stats.winnerIndex = state.G.order.indexOf(winnerId);
  stats.turnsPerPlayer = state.ctx.turn / strategies.length;
  stats.leaderAtHalfWon = halfLeader === winnerId;
  stats.lastAtHalfWon = halfLast === winnerId;
  stats.firstArrivalWon = firstArrival === winnerId;
  stats.turnsAtSafeWinner = (state.ctx.turn - (arrivedTurn[winnerId] ?? state.ctx.turn)) / strategies.length;
  stats.lowResourceShare = lowResource / sampled;
  stats.depthGapAtEnd = (finalDepths[0] - finalDepths[finalDepths.length - 1]) / maxDepth(state);

  return stats;
};

const summarize = (label: string, strategies: TStrategy[], count: number): string[] => {
  const runs = Array.from({ length: count }, (_, index) => playParty(`sim-${label}-${index}`, strategies));
  const winRates = strategies.map((_, place) => runs.filter(run => run.winnerIndex === place).length / count);
  const phases = Object.values(EPhase)
    .filter(phase => runs.some(run => run.phaseCounts[phase]))
    .map(phase => `${phase} ${average(runs.map(run => run.phaseReal[phase] ?? 0))}/${average(runs.map(run => run.phaseCounts[phase] ?? 0))}`);
  const metrics: Record<string, number> = {
    turnsPerPlayer: average(runs.map(run => run.turnsPerPlayer)),
    realDecisionsPerPlayerTurn: average(runs.map(run => run.realDecisions / (run.turnsPerPlayer * strategies.length))),
    leadChanges: average(runs.map(run => run.leadChanges)),
    leaderAtHalfWon: average(runs.map(run => Number(run.leaderAtHalfWon))),
    lastAtHalfWon: average(runs.map(run => Number(run.lastAtHalfWon))),
    firstArrivalWon: average(runs.map(run => Number(run.firstArrivalWon))),
    safeAttempts: average(runs.map(run => run.safeAttempts)),
    winnerTurnsAtSafe: average(runs.map(run => run.turnsAtSafeWinner)),
    avgResource: average(runs.flatMap(run => run.resourceSamples)),
    resourceUnder3: average(runs.map(run => run.lowResourceShare)),
    depthGapAtEnd: average(runs.map(run => run.depthGapAtEnd)),
  };

  return [
    `=== ${label}: [${strategies.join(', ')}] x ${count}`,
    `winrate по местам: ${winRates.map(rate => `${Math.round(rate * 100)}%`).join(' ')}`,
    ...Object.entries(metrics).map(([name, value]) => `  ${name}: ${value}`),
    `фазы (реальные решения/всего на партию): ${phases.join(', ')}`,
    '',
  ];
};

export const runSimulation = ({ mode, count, events = [] }: TSimulationParams): string[] => {
  randomState = 12345;
  generatedEvents = events;

  switch (mode) {
    case 'ablate':
      return [
        ...summarize('optOracle-vs-optWorst', ['optOracle', 'optWorst'], count),
        ...ABLATED_PHASES.flatMap(phase =>
          summarize(`smart-only-${phase}`, [`phaseSmart:${phase}`, 'casual'], count)),
      ];
    case 'base':
      return [
        ...summarize('auto2', ['auto', 'auto'], count * 3),
        ...summarize('casual2', ['casual', 'casual'], count * 3),
        ...summarize('casual4', ['casual', 'casual', 'casual', 'casual'], count * 2),
      ];
    case 'cards':
      return [
        ...summarize('casual-vs-noCards', ['casual', 'noCards'], count),
        ...summarize('casual-vs-3noCards', ['casual', 'noCards', 'noCards', 'noCards'], count),
      ];
    default:
      return [
        ...summarize('smart-vs-casual2', ['smart', 'casual'], count),
        ...summarize('oracle-vs-casual2', ['oracle', 'casual'], count),
        ...summarize('smart-vs-casual4', ['smart', 'casual', 'casual', 'casual'], count),
        ...summarize('hinted-vs-casual2', ['hinted', 'casual'], count),
        ...summarize('hinted-vs-casual4', ['hinted', 'casual', 'casual', 'casual'], count),
        ...summarize('random-vs-casual2', ['random', 'casual'], count * 2),
      ];
  }
};
