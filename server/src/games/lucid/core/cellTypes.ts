import { LucidShared } from '@trgames/shared';

import { randomInt, shuffle } from '@/games/lucid/core/random';

const EVENT_SHARE = 0.4;
const GREEN_SHARE = 0.15;
const RED_SHARE = 0.15;

interface TAssignResult {
  track: LucidShared.TTrack;
  random: LucidShared.TRandomState;
}

// Порталы — на прямых клетках, по паре в каждой половине пути; клетки пары
// разнесены на 4–9 уровней глубины, то есть перенос не дальше 8 клеток
const pickPortals = (
  track: LucidShared.TTrack,
  random: LucidShared.TRandomState,
): { portals: Map<number, LucidShared.TPortal>; random: LucidShared.TRandomState } => {
  const depths = LucidShared.trackDepths(track);
  const perDepth = new Map<number, number>();

  Object.values(depths).forEach(depth => perDepth.set(depth, (perDepth.get(depth) ?? 0) + 1));

  const straight = track.cells
    .filter(cell => cell.id !== track.startId && cell.id !== track.finishId)
    .filter(cell => cell.next.length === 1 && perDepth.get(depths[cell.id]) === 1)
    .sort((first, second) => depths[first.id] - depths[second.id]);

  let current = random;
  const portals = new Map<number, LucidShared.TPortal>();

  [0, 1].forEach(pair => {
    const half = straight.slice(
      Math.floor((pair * straight.length) / 2),
      Math.floor(((pair + 1) * straight.length) / 2),
    );
    const order = shuffle(current, half);

    current = order.state;

    for (const first of order.value) {
      const candidates = half.filter(cell => {
        const distance = depths[cell.id] - depths[first.id];

        return distance >= 4 && distance <= 9;
      });

      if (candidates.length > 0) {
        const picked = randomInt(current, 0, candidates.length - 1);

        current = picked.state;
        portals.set(first.id, { pair, to: candidates[picked.value].id });
        portals.set(candidates[picked.value].id, { pair, to: first.id });
        break;
      }
    }
  });

  return { portals, random: current };
};

export const assignCellTypes = (
  track: LucidShared.TTrack,
  random: LucidShared.TRandomState,
): TAssignResult => {
  const { portals, random: afterPortals } = pickPortals(track, random);
  const rest = track.cells
    .map(cell => cell.id)
    .filter(id => id !== track.startId && id !== track.finishId && !portals.has(id));
  const shuffled = shuffle(afterPortals, rest);
  const events = Math.round(rest.length * EVENT_SHARE);
  const greens = events + Math.round(rest.length * GREEN_SHARE);
  const reds = greens + Math.round(rest.length * RED_SHARE);
  const typeById = new Map<number, LucidShared.ECellType>();

  shuffled.value.forEach((id, index) => {
    if (index < events) {
      typeById.set(id, LucidShared.ECellType.EVENT);
    } else if (index < greens) {
      typeById.set(id, LucidShared.ECellType.GREEN);
    } else if (index < reds) {
      typeById.set(id, LucidShared.ECellType.RED);
    } else {
      typeById.set(id, LucidShared.ECellType.EMPTY);
    }
  });

  return {
    track: {
      ...track,
      cells: track.cells.map(cell => {
        const portal = portals.get(cell.id);

        if (portal) {
          return { ...cell, type: LucidShared.ECellType.PORTAL, portal };
        }

        const type = typeById.get(cell.id);

        return type ? { ...cell, type } : cell;
      }),
    },
    random: shuffled.state,
  };
};
