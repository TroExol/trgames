import { LucidShared } from '@trgames/shared';

const RED_FILL = '#c8553d';
const GREEN_FILL = '#5a9e4b';
const PORTAL_RINGS = ['#8e5bd0', '#2f8fd8'];

export const ZONE_LABEL: Record<LucidShared.EDiceZone, string> = {
  [LucidShared.EDiceZone.ONE]: '1 кубик',
  [LucidShared.EDiceZone.PICK]: '2 кубика · выбор',
  [LucidShared.EDiceZone.SUM]: '2 кубика · сумма',
};

export interface TCellLook {
  fill: string;
  glyph?: string;
  ring?: string;
}

export const cellLook = (cell: LucidShared.TCell, isVisited: boolean): TCellLook => {
  switch (cell.type) {
    case LucidShared.ECellType.EVENT:
      return isVisited ? { fill: 'ink' } : { fill: 'hollow', glyph: '?' };
    case LucidShared.ECellType.GREEN:
      return { fill: GREEN_FILL };
    case LucidShared.ECellType.PORTAL:
      return { fill: 'hollow', ring: PORTAL_RINGS[(cell.portal?.pair ?? 0) % PORTAL_RINGS.length] };
    case LucidShared.ECellType.RED:
      return { fill: RED_FILL };
    default:
      return { fill: isVisited ? 'ink' : 'hollow' };
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

  return [LucidShared.EDiceZone.PICK, LucidShared.EDiceZone.SUM].flatMap(zone => {
    const first = firstByZone.get(zone);

    return first ? [{ cellId: first.cellId, zone }] : [];
  });
};
