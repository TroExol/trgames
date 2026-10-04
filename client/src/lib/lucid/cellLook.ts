import { LucidShared } from '@trgames/shared';

const RED_FILL = '#c8553d';
const GREEN_FILL = '#5a9e4b';
export const LAW_FILL = '#c9a227';
export const SHOP_FILL = '#3f7cc4';
const PORTAL_RINGS = ['#8e5bd0', '#2f8fd8'];

export const ZONE_LABEL: Record<LucidShared.EDiceZone, string> = {
  [LucidShared.EDiceZone.ONE]: '1 кубик',
  [LucidShared.EDiceZone.PICK]: '2 кубика · выбор',
};

export const SAFE_LABEL = `Сейф · ${LucidShared.SAFE_THRESHOLD}+`;

export type TCellShape = 'diamond' | 'disc' | 'dot' | 'hex' | 'house' | 'portal' | 'tile';

export type TCellIcon = 'FINISH' | 'GREEN' | 'LAW' | 'RED' | 'SHOP' | 'START';

export interface TCellLook {
  shape: TCellShape;
  fill: string;
  icon?: TCellIcon;
  label?: string;
}

export const cellLook = (cell: LucidShared.TCell, isVisited: boolean): TCellLook => {
  const inkOrHollow = isVisited ? 'ink' : 'hollow';

  switch (cell.type) {
    case LucidShared.ECellType.EVENT:
      return isVisited
        ? { shape: 'diamond', fill: 'ink' }
        : { shape: 'diamond', fill: 'hollow', label: '?' };
    case LucidShared.ECellType.FINISH:
      return { shape: 'tile', fill: inkOrHollow, icon: 'FINISH' };
    case LucidShared.ECellType.GREEN:
      return { shape: 'disc', fill: GREEN_FILL, icon: 'GREEN' };
    case LucidShared.ECellType.LAW:
      return { shape: 'hex', fill: LAW_FILL, icon: 'LAW' };
    case LucidShared.ECellType.PORTAL: {
      const pair = cell.portal?.pair ?? 0;

      return { shape: 'portal', fill: PORTAL_RINGS[pair % PORTAL_RINGS.length], label: String(pair + 1) };
    }
    case LucidShared.ECellType.RED:
      return { shape: 'disc', fill: RED_FILL, icon: 'RED' };
    case LucidShared.ECellType.SHOP:
      return { shape: 'house', fill: SHOP_FILL, icon: 'SHOP' };
    case LucidShared.ECellType.START:
      return { shape: 'tile', fill: inkOrHollow, icon: 'START' };
    default:
      return { shape: 'dot', fill: inkOrHollow };
  }
};

export const zoneStarts = (track: LucidShared.TTrack): { cellId: number; zone: LucidShared.EDiceZone }[] => {
  const depths = LucidShared.trackDepths(track);
  const maxDepth = depths[track.finishId] ?? 0;
  const firstByZone = new Map<LucidShared.EDiceZone, { cellId: number; depth: number }>();

  track.cells.forEach(cell => {
    const depth = depths[cell.id] ?? 0;
    const zone = LucidShared.diceZoneForDepth(depth, maxDepth);
    const known = firstByZone.get(zone);

    if (zone !== LucidShared.EDiceZone.ONE && (!known || depth < known.depth)) {
      firstByZone.set(zone, { cellId: cell.id, depth });
    }
  });

  const first = firstByZone.get(LucidShared.EDiceZone.PICK);

  return first ? [{ cellId: first.cellId, zone: LucidShared.EDiceZone.PICK }] : [];
};
