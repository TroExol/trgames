import { LucidShared } from '@trgames/shared';

import { resolveTarget } from '@/games/lucid/core/targets';
import { moveBy } from '@/games/lucid/core/movement';

interface TAtomParams {
  actorId: LucidShared.TPlayerId;
  targets: LucidShared.TPlayerId[];
  value: number;
}

type TAtomHandler = (G: LucidShared.TG, params: TAtomParams) => LucidShared.TG;

const updatePlayers = (
  G: LucidShared.TG,
  targets: LucidShared.TPlayerId[],
  update: (player: LucidShared.TPlayer) => LucidShared.TPlayer,
): LucidShared.TG => ({
  ...G,
  players: targets.reduce(
    (players, id) => ({ ...players, [id]: update(players[id]) }),
    G.players,
  ),
});

export const ATOMS: Record<LucidShared.EAtomKind, TAtomHandler> = {
  [LucidShared.EAtomKind.MOVE]: (G, { targets, value }) => updatePlayers(G, targets, player => ({
    ...player,
    position: moveBy(G.track, player.position, value),
  })),

  // Долг: отдаёшь сколько есть, отрицательного запаса не бывает
  [LucidShared.EAtomKind.RESOURCE]: (G, { targets, value }) => updatePlayers(G, targets, player => ({
    ...player,
    resource: Math.max(player.resource + value, 0),
  })),

  [LucidShared.EAtomKind.SKIP_TURN]: (G, { targets, value }) => updatePlayers(G, targets, player => ({
    ...player,
    skipTurns: Math.max(player.skipTurns + value, 0),
  })),

  // Единственный атом, затрагивающий двоих сразу. Цель игнорируется:
  // обмен всегда происходит между ходящим игроком и лидером
  [LucidShared.EAtomKind.SWAP_WITH_FIRST]: (G, { actorId }) => {
    const [firstId] = resolveTarget(G, actorId, LucidShared.ETarget.FIRST);

    if (!firstId || firstId === actorId) {
      return G;
    }

    return {
      ...G,
      players: {
        ...G.players,
        [actorId]: { ...G.players[actorId], position: G.players[firstId].position },
        [firstId]: { ...G.players[firstId], position: G.players[actorId].position },
      },
    };
  },
};

export const applyAtom = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
  atom: LucidShared.TAtom,
): LucidShared.TG => ATOMS[atom.kind](G, {
  actorId,
  value: atom.value,
  targets: resolveTarget(G, actorId, atom.target),
});
