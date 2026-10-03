import { LucidShared } from '@trgames/shared';

export const GREEN_REWARD = 3;
export const RED_PENALTY = 3;

const withResource = (G: LucidShared.TG, playerId: LucidShared.TPlayerId, delta: number): LucidShared.TG => {
  const player = G.players[playerId];
  const resource = Math.max(player.resource + delta, 0);
  const actual = resource - player.resource;
  const color = delta > 0 ? 'зелёная' : 'красная';
  const sign = actual >= 0 ? '+' : '−';

  return {
    ...G,
    players: { ...G.players, [playerId]: { ...player, resource } },
    log: [...G.log, `${player.nickname}: ${color} клетка, ${G.theme.resourceName} ${sign}${Math.abs(actual)}`],
  };
};

// Эффект клетки, на которой закончилось движение своим ходом. Событие сюда
// не входит — его разыгрывает редьюсер фазой CHOICE
export const landOnCell = (G: LucidShared.TG, playerId: LucidShared.TPlayerId): LucidShared.TG => {
  const player = G.players[playerId];
  const cell = G.track.cells.find(item => item.id === player.position);

  switch (cell?.type) {
    case LucidShared.ECellType.GREEN:
      return withResource(G, playerId, GREEN_REWARD);
    case LucidShared.ECellType.PORTAL: {
      const to = cell.portal?.to;

      if (to === undefined) {
        return G;
      }

      return {
        ...G,
        players: { ...G.players, [playerId]: { ...player, position: to } },
        visited: G.visited.includes(to) ? G.visited : [...G.visited, to],
        log: [...G.log, `${player.nickname} проходит портал`],
      };
    }
    case LucidShared.ECellType.RED:
      return withResource(G, playerId, -RED_PENALTY);
    default:
      return G;
  }
};
