import { LucidShared } from '@trgames/shared';

import { randomInt, shuffle } from '@/games/lucid/core/random';

const EVENT_SHARE = 0.4;
const GREEN_SHARE = 0.15;
const RED_SHARE = 0.15;

interface TAssignResult {
  track: LucidShared.TTrack;
  random: LucidShared.TRandomState;
}

// Порталы — на прямых клетках, по одной из каждой четверти пути: пары
// 1–3 и 2–4 четвертей, так что пара всегда разнесена по треку
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
  const picks = [0, 1, 2, 3].map(index => {
    const quarter = straight.slice(
      Math.floor((index * straight.length) / 4),
      Math.floor(((index + 1) * straight.length) / 4),
    );
    const picked = randomInt(current, 0, quarter.length - 1);

    current = picked.state;

    return quarter[picked.value].id;
  });

  const portals = new Map<number, LucidShared.TPortal>([
    [picks[0], { pair: 0, to: picks[2] }],
    [picks[2], { pair: 0, to: picks[0] }],
    [picks[1], { pair: 1, to: picks[3] }],
    [picks[3], { pair: 1, to: picks[1] }],
  ]);

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
