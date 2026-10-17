import { LucidShared } from '@trgames/shared';

import { resolveTarget } from '@/games/lucid/core/targets';
import { rollDie } from '@/games/lucid/core/random';
import { stepBy } from '@/games/lucid/core/cells';
import { giveCard } from '@/games/lucid/core/cards';
import { drawEvent } from '@/games/lucid/core/calamity';

export type TLawTiming = 'END' | 'LANDED' | 'ROLLED' | 'START';

export type TLawPause =
  | { kind: 'EVENT'; cellId: number }
  | { kind: 'LAW_EVENT'; event: LucidShared.TEvent };

interface TLawContext {
  G: LucidShared.TG;
  playerId: LucidShared.TPlayerId;
}

interface TLawEffect {
  timing: TLawTiming;
  applies: (context: TLawContext) => boolean;
  apply: (context: TLawContext) => { G: LucidShared.TG; pause?: TLawPause };
}

const { ECellType, ELaw } = LucidShared;

export const log = (G: LucidShared.TG, line: string): LucidShared.TG => ({ ...G, log: [...G.log, line] });

const lawLine = (
  law: LucidShared.ELaw,
  playerId: LucidShared.TPlayerId,
  G: LucidShared.TG,
  what: string,
): string => `закон «${LucidShared.cardName(G, law)}»: ${G.players[playerId].nickname} — ${what}`;

export const addResource = (G: LucidShared.TG, playerId: LucidShared.TPlayerId, delta: number): LucidShared.TG => ({
  ...G,
  players: {
    ...G.players,
    [playerId]: { ...G.players[playerId], resource: Math.max(G.players[playerId].resource + delta, 0) },
  },
});

const landedType = ({ G }: TLawContext): LucidShared.ECellType | undefined =>
  G.track.cells.find(cell => cell.id === G.turn.landedCellId)?.type;

const isLast = ({ G, playerId }: TLawContext): boolean =>
  resolveTarget(G, playerId, LucidShared.ETarget.LAST)[0] === playerId;

const rolledValues = ({ G }: TLawContext): number[] =>
  G.lastRoll?.values ?? (G.lastRoll ? [G.lastRoll.value] : []);

const advance = (law: LucidShared.ELaw, steps: number) => ({ G, playerId }: TLawContext) => {
  const player = G.players[playerId];

  if (player.position === G.track.finishId) {
    return { G };
  }

  return { G: stepBy(log(G, lawLine(law, playerId, G, `+${steps} клеток`)), playerId, steps) };
};

const playEvent = (law: LucidShared.ELaw, kind: 'bad' | 'good') => ({ G, playerId }: TLawContext) => {
  const drawn = drawEvent(G, kind);

  if (drawn.cellId === undefined) {
    return { G: log(G, lawLine(law, playerId, G, kind === 'bad' ? 'бед в этом мире нет' : 'событий нет')) };
  }

  const event = G.events[drawn.cellId];
  const { resource } = G.players[playerId];

  if (!event.options.some(option => !option.cost || option.cost <= resource)) {
    return { G: log(drawn.G, `${G.players[playerId].nickname}: событие «${event.title}» не по карману`) };
  }

  return {
    G: log(drawn.G, lawLine(law, playerId, G, `событие «${event.title}»`)),
    pause: { kind: 'EVENT', cellId: drawn.cellId } as const,
  };
};

const tollEvent = (G: LucidShared.TG): LucidShared.TEvent => ({
  cellId: -1,
  title: LucidShared.cardName(G, ELaw.RED_CHOICE),
  text: LucidShared.LAW_TEXT[ELaw.RED_CHOICE].rule(G.theme.resourceName),
  options: [
    {
      text: `Отдать ${G.theme.resourceName}: 3`,
      success: { atoms: [{ kind: LucidShared.EAtomKind.RESOURCE, target: LucidShared.ETarget.SELF, value: -3 }] },
    },
    {
      text: 'Отступить на 3 клетки',
      success: { atoms: [{ kind: LucidShared.EAtomKind.MOVE, target: LucidShared.ETarget.SELF, value: -3 }] },
    },
  ],
});

const extraTurn = (law: LucidShared.ELaw) => ({ G, playerId }: TLawContext) => ({
  G: log({ ...G, turn: { ...G.turn, extraTurn: true } }, lawLine(law, playerId, G, 'ходит ещё раз')),
});

const LAW_EFFECTS: Partial<Record<LucidShared.ELaw, TLawEffect>> = {
  [ELaw.GREEN_RESOURCE]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.GREEN,
    apply: ({ G, playerId }) => ({
      G: log(addResource(G, playerId, 5), lawLine(ELaw.GREEN_RESOURCE, playerId, G, `${G.theme.resourceName} +5`)),
    }),
  },
  [ELaw.GREEN_ADVANCE]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.GREEN,
    apply: advance(ELaw.GREEN_ADVANCE, 7),
  },
  [ELaw.GREEN_AGAIN]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.GREEN,
    apply: extraTurn(ELaw.GREEN_AGAIN),
  },
  [ELaw.GREEN_GOOD]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.GREEN,
    apply: playEvent(ELaw.GREEN_GOOD, 'good'),
  },
  [ELaw.RED_BAD]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.RED,
    apply: playEvent(ELaw.RED_BAD, 'bad'),
  },
  [ELaw.RED_CHOICE]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.RED,
    apply: ({ G }) => ({ G, pause: { kind: 'LAW_EVENT', event: tollEvent(G) } }),
  },
  [ELaw.RED_PAY_ALL]: {
    timing: 'LANDED',
    applies: context => landedType(context) === ECellType.RED,
    apply: ({ G, playerId }) => {
      const others = G.order.filter(id => id !== playerId);
      const share = others.length === 1 ? 4 : 2;
      const paid = others.reduce((state, id) => {
        const given = Math.min(state.players[playerId].resource, share);

        return addResource(addResource(state, playerId, -given), id, given);
      }, G);

      return { G: log(paid, lawLine(ELaw.RED_PAY_ALL, playerId, G, `платит по ${share}`)) };
    },
  },
  [ELaw.OVERTAKE_STEAL]: {
    timing: 'ROLLED',
    applies: () => true,
    apply: ({ G, playerId }) => {
      const depths = LucidShared.trackDepths(G.track);
      const depthOf = (id: LucidShared.TPlayerId): number => depths[G.players[id].position] ?? 0;
      const from = depths[G.turn.from ?? G.players[playerId].position] ?? 0;
      const to = depthOf(playerId);
      const overtaken = G.order
        .filter(id => id !== playerId)
        .filter(id => depthOf(id) >= from && depthOf(id) < to);

      if (overtaken.length === 0) {
        return { G };
      }

      const stolen = overtaken.reduce((state, id) => {
        const taken = Math.min(state.players[id].resource, 3);

        return addResource(addResource(state, id, -taken), playerId, taken);
      }, G);
      const names = overtaken.map(id => G.players[id].nickname).join(', ');

      return { G: log(stolen, lawLine(ELaw.OVERTAKE_STEAL, playerId, G, `забирает у: ${names}`)) };
    },
  },
  [ELaw.SIX_SKIP]: {
    timing: 'ROLLED',
    applies: context => rolledValues(context).includes(6),
    apply: ({ G, playerId }) => {
      const player = G.players[playerId];
      const skipped = {
        ...G,
        players: { ...G.players, [playerId]: { ...player, skipTurns: player.skipTurns + 1 } },
      };

      return { G: log(skipped, lawLine(ELaw.SIX_SKIP, playerId, G, 'пропустит следующий ход')) };
    },
  },
  [ELaw.DOUBLE_AGAIN]: {
    timing: 'ROLLED',
    applies: context => {
      const values = rolledValues(context);

      return values.length === 2 && values[0] === values[1];
    },
    apply: extraTurn(ELaw.DOUBLE_AGAIN),
  },
  [ELaw.LAST_START_RESOURCE]: {
    timing: 'START',
    applies: isLast,
    apply: ({ G, playerId }) => ({
      G: log(
        addResource(G, playerId, 3),
        lawLine(ELaw.LAST_START_RESOURCE, playerId, G, `${G.theme.resourceName} +3`),
      ),
    }),
  },
  [ELaw.LAST_START_FREE_CARD]: {
    timing: 'START',
    applies: isLast,
    apply: ({ G, playerId }) => {
      const given = giveCard(G, playerId);

      if ((given.cards.hands[playerId] ?? []).length === (G.cards.hands[playerId] ?? []).length) {
        return { G };
      }

      return { G: log(given, lawLine(ELaw.LAST_START_FREE_CARD, playerId, G, 'берёт карту')) };
    },
  },
  [ELaw.LAST_START_GOOD]: {
    timing: 'START',
    applies: isLast,
    apply: playEvent(ELaw.LAST_START_GOOD, 'good'),
  },
  [ELaw.LAST_END_ADVANCE]: {
    timing: 'END',
    applies: isLast,
    apply: advance(ELaw.LAST_END_ADVANCE, 5),
  },
  [ELaw.LAST_END_DIE]: {
    timing: 'END',
    applies: isLast,
    apply: ({ G, playerId }) => {
      const rolled = rollDie(G.random);

      return {
        G: log(
          addResource({ ...G, random: rolled.state }, playerId, rolled.value),
          lawLine(ELaw.LAST_END_DIE, playerId, G, `выпало ${rolled.value}, ${G.theme.resourceName} +${rolled.value}`),
        ),
      };
    },
  },
};

export interface TLawRun {
  G: LucidShared.TG;
  pause?: TLawPause;
}

export const runLaws = (G: LucidShared.TG, playerId: LucidShared.TPlayerId, timing: TLawTiming): TLawRun => {
  let current = G;

  for (const law of G.cards.laws) {
    const effect = law ? LAW_EFFECTS[law] : undefined;

    if (!law || !effect || effect.timing !== timing || current.turn.fired.includes(law)) {
      continue;
    }

    if (!effect.applies({ G: current, playerId })) {
      continue;
    }

    const fired = { ...current, turn: { ...current.turn, fired: [...current.turn.fired, law] } };
    const result = effect.apply({ G: fired, playerId });

    if (result.pause) {
      return result;
    }

    current = result.G;
  }

  return { G: current };
};
