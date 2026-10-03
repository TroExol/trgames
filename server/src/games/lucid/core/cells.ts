import { LucidShared } from '@trgames/shared';

// Эффект клетки, на которой закончилось движение своим ходом. Событие сюда
// не входит — его разыгрывает редьюсер фазой CHOICE
export const landOnCell = (G: LucidShared.TG, playerId: LucidShared.TPlayerId): LucidShared.TG => {
  const player = G.players[playerId];
  const cell = G.track.cells.find(item => item.id === player.position);

  switch (cell?.type) {
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
    default:
      return G;
  }
};
