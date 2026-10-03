import { LucidShared } from '@trgames/shared';

export interface TContentMetrics {
  // Доля событий, где хотя бы один вариант стоит ресурса
  paidOptionShare: number;
  // Доля событий, где есть эффект против лидера
  antiLeaderShare: number;
  // Доля событий, где есть эффект в помощь последнему
  helpLastShare: number;
  // Доля «бед»: ни в одной ветке ни одного варианта нет чистого плюса ходящему
  calamityShare: number;
  // Средняя длина текста события и варианта в символах — цель промпта ~140 и ~50
  avgEventTextLength: number;
  avgOptionTextLength: number;
}

const effectAtoms = (effect?: LucidShared.TEffect): LucidShared.TAtom[] =>
  effect ? [...effect.atoms, ...(effect.otherwise ?? [])] : [];

// Атомы разбросаны по успеху, провалу и обеим веткам условия — событие
// считается настолько, насколько вредно или полезно хотя бы одно их сочетание
const eventAtoms = (event: LucidShared.TEvent): LucidShared.TAtom[] =>
  event.options.flatMap(option => [...effectAtoms(option.success), ...effectAtoms(option.failure)]);

// SWAP_WITH_FIRST всегда меняет местами ходящего и лидера — вред лидеру
// не зависит от того, что записано в target у этого атома
const isAgainstLeader = (atom: LucidShared.TAtom): boolean => {
  if (atom.kind === LucidShared.EAtomKind.SWAP_WITH_FIRST) {
    return true;
  }

  if (atom.target !== LucidShared.ETarget.FIRST) {
    return false;
  }

  switch (atom.kind) {
    case LucidShared.EAtomKind.MOVE:
    case LucidShared.EAtomKind.RESOURCE:
      return atom.value < 0;
    case LucidShared.EAtomKind.SKIP_TURN:
      return true;
    default:
      return false;
  }
};

const isHelpForLast = (atom: LucidShared.TAtom): boolean => {
  if (atom.target !== LucidShared.ETarget.LAST) {
    return false;
  }

  switch (atom.kind) {
    case LucidShared.EAtomKind.MOVE:
    case LucidShared.EAtomKind.RESOURCE:
      return atom.value > 0;
    default:
      return false;
  }
};

// Чистый плюс ходящему: вперёд или ресурс себе (или всем — ходящий среди них),
// либо обмен с лидером. Плюсы, выданные FIRST/LAST, не считаем: кто окажется
// лидером или последним, заранее неизвестно, а у беды они и не нужны. Цена
// (cost) плюсом не бывает, поэтому в расчёте её нет
const isGainForMover = (atom: LucidShared.TAtom): boolean => {
  if (atom.kind === LucidShared.EAtomKind.SWAP_WITH_FIRST) {
    return true;
  }

  if (atom.target !== LucidShared.ETarget.SELF && atom.target !== LucidShared.ETarget.ALL) {
    return false;
  }

  return (atom.kind === LucidShared.EAtomKind.MOVE || atom.kind === LucidShared.EAtomKind.RESOURCE)
    && atom.value > 0;
};

// Беда — событие с вариантами, где все ветки всех вариантов (успех, провал,
// обе стороны условия) обходятся без чистого плюса ходящему
const isCalamity = (event: LucidShared.TEvent): boolean =>
  event.options.length > 0 && !eventAtoms(event).some(isGainForMover);

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const share = (events: LucidShared.TEvent[], match: (event: LucidShared.TEvent) => boolean): number =>
  events.length === 0 ? 0 : events.filter(match).length / events.length;

// Метрики содержания партии — доли событий с определённым видом эффекта.
// Считаются одинаково для настоящей и для запасной партии: запасная тоже
// проходит через ту же самую формулу, а не помечается отдельно
export const computeContentMetrics = (content: LucidShared.TPartyContent): TContentMetrics => {
  const events = Object.values(content.events);

  return {
    paidOptionShare: share(events, event => event.options.some(option => option.cost !== undefined)),
    antiLeaderShare: share(events, event => eventAtoms(event).some(isAgainstLeader)),
    helpLastShare: share(events, event => eventAtoms(event).some(isHelpForLast)),
    calamityShare: share(events, isCalamity),
    avgEventTextLength: average(events.map(event => event.text.length)),
    avgOptionTextLength: average(events.flatMap(event => event.options.map(option => option.text.length))),
  };
};
