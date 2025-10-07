import { CryptozShared } from '@trgames/shared';

const frameHighlight = 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_12px_30px_-20px_rgba(0,0,0,0.45)]';

export const cardTypeColors = {
  [CryptozShared.ECardType.ARTIFACT]: `${frameHighlight} bg-gradient-to-br from-amber-950 via-amber-900/60 to-stone-950 text-amber-100 border-amber-900/70`, // Золотистые цвета
  [CryptozShared.ECardType.CHAOS]: `${frameHighlight} bg-gradient-to-br from-rose-950 via-rose-900/60 to-zinc-950 text-rose-100 border-rose-900/70`, // Тёмно-красные цвета
  [CryptozShared.ECardType.COMPANION]: `${frameHighlight} bg-gradient-to-br from-emerald-950 via-emerald-900/60 to-slate-950 text-emerald-100 border-emerald-900/70`, // Зелёные цвета
  [CryptozShared.ECardType.CREATURE]: `${frameHighlight} bg-gradient-to-br from-indigo-950 via-indigo-900/60 to-slate-950 text-indigo-100 border-indigo-900/70`, // Фиолетово-синие цвета
  [CryptozShared.ECardType.CRYPT]: `${frameHighlight} bg-gradient-to-br from-zinc-950 via-slate-950 to-black text-zinc-100 border-zinc-900/70`, // Серо-чёрные цвета
  [CryptozShared.ECardType.CURSED_SEAL]: `${frameHighlight} bg-gradient-to-br from-purple-950 via-purple-900/60 to-slate-950 text-purple-100 border-purple-900/70`, // Тёмно-фиолетовые цвета
  [CryptozShared.ECardType.DARKNESS_MADNESS]: `${frameHighlight} bg-gradient-to-br from-fuchsia-950 via-fuchsia-900/60 to-slate-950 text-fuchsia-100 border-fuchsia-900/70`, // Ярко-розовые цвета
  [CryptozShared.ECardType.HARBINGER]: `${frameHighlight} bg-gradient-to-br from-teal-950 via-teal-900/60 to-slate-950 text-teal-100 border-teal-900/70`, // Бирюзовые цвета
  [CryptozShared.ECardType.RITUAL]: `${frameHighlight} bg-gradient-to-br from-orange-950 via-amber-900/60 to-stone-950 text-orange-100 border-orange-900/70`, // Оранжевые цвета
  [CryptozShared.ECardType.SPARK]: `${frameHighlight} bg-gradient-to-br from-sky-950 via-blue-900/60 to-slate-950 text-sky-100 border-sky-900/70`, // Синие цвета
  [CryptozShared.ECardType.WICKEDNESS]: `${frameHighlight} bg-gradient-to-br from-lime-950 via-lime-900/60 to-slate-950 text-lime-100 border-lime-900/70`, // Лаймовые цвета
};
