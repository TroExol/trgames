import { LucidShared } from '@trgames/shared';

import { resolveTarget } from '@/games/lucid/core/targets';

// Строка ленты для одного применённого атома — с реальными никами целей,
// в отличие от общей подписи карточки события (LucidShared.describeAtom).
// Разрешение целей повторяет то, что делает applyAtom внутри, но на том же G,
// до применения атома: позиции, по которым считаются FIRST/LAST, ещё не сдвинуты
export const describeAtomLog = (
  G: LucidShared.TG,
  actorId: LucidShared.TPlayerId,
  atom: LucidShared.TAtom,
): string => {
  if (atom.kind === LucidShared.EAtomKind.SWAP_WITH_FIRST) {
    const [firstId] = resolveTarget(G, actorId, LucidShared.ETarget.FIRST);

    if (!firstId) {
      return 'обмена нет: ничья';
    }
    if (firstId === actorId) {
      return 'обмена нет: лидер — сам игрок';
    }

    return `${G.players[actorId].nickname} меняется местами с ${G.players[firstId].nickname}`;
  }

  const targets = resolveTarget(G, actorId, atom.target);

  if (targets.length === 0) {
    return atom.target === LucidShared.ETarget.FIRST
      ? 'лидера нет — ничья, никого не задело'
      : 'отстающего нет — ничья, никого не задело';
  }

  const label = atom.target === LucidShared.ETarget.ALL
    ? 'все'
    : targets.map(id => G.players[id].nickname).join(', ');

  return `${label}: ${LucidShared.describeAtomAction(atom, G.theme.resourceName)}`;
};
