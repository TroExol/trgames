import { LucidShared } from '@trgames/shared';

// Крайний игрок: ближайший к финишу или самый дальний от него.
// При равенстве нескольких игроков крайним не считается никто
const extremePlayer = (
  G: LucidShared.TG,
  pick: 'max' | 'min',
): LucidShared.TPlayerId[] => {
  const players = G.order.map(id => G.players[id]);
  const positions = players.map(player => player.position);
  const edge = pick === 'max' ? Math.max(...positions) : Math.min(...positions);
  const matched = players.filter(player => player.position === edge);

  return matched.length === 1 ? [matched[0].id] : [];
};

export const resolveTarget = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
  target: LucidShared.ETarget,
): LucidShared.TPlayerId[] => {
  switch (target) {
    case LucidShared.ETarget.ALL:
      return [...G.order];
    case LucidShared.ETarget.FIRST:
      return extremePlayer(G, 'max');
    case LucidShared.ETarget.LAST:
      return extremePlayer(G, 'min');
    case LucidShared.ETarget.SELF:
      return [actorId];
  }
};

export const nearestAhead = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
): { id: LucidShared.TPlayerId; distance: number } | undefined => {
  const depths = LucidShared.trackDepths(G.track);
  const own = depths[G.players[actorId].position] ?? 0;
  const ahead = G.order
    .filter(id => id !== actorId && G.players[id].position !== G.track.finishId)
    .map(id => ({ id, distance: (depths[G.players[id].position] ?? 0) - own }))
    .filter(item => item.distance > 0);

  return ahead.reduce<{ id: LucidShared.TPlayerId; distance: number } | undefined>(
    (best, item) => (!best || item.distance < best.distance ? item : best),
    undefined,
  );
};
