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
