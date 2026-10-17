import type { TCardName } from './types/content';

import { ECellType } from './types/track';
import { ELaw, EShopCard } from './types/cards';

export interface TCardText {
  name: string;
  rule: (resourceName: string) => string;
}

export const LAW_TEXT: Record<ELaw, TCardText> = {
  [ELaw.DOUBLE_AGAIN]: { name: 'Дубль', rule: () => 'Выпали два одинаковых кубика — ходи ещё раз' },
  [ELaw.GREEN_ADVANCE]: { name: 'Тропа', rule: () => 'Остановился на зелёной — пройди 7 клеток вперёд' },
  [ELaw.GREEN_AGAIN]: { name: 'Второе дыхание', rule: () => 'Остановился на зелёной — ходи ещё раз' },
  [ELaw.GREEN_GOOD]: { name: 'Добрый знак', rule: () => 'Остановился на зелёной — разыграй случайное событие без беды' },
  [ELaw.GREEN_RESOURCE]: { name: 'Урожай', rule: resource => `Остановился на зелёной: ${resource} +5` },
  [ELaw.LAST_END_ADVANCE]: {
    name: 'Попутный ветер',
    rule: () => 'Отстающий в конце своего хода проходит 5 клеток вперёд',
  },
  [ELaw.LAST_END_DIE]: {
    name: 'Лотерея',
    rule: resource => `Отстающий в конце своего хода бросает кубик и получает столько: ${resource}`,
  },
  [ELaw.LAST_START_FREE_CARD]: {
    name: 'Подарок',
    rule: () => 'Отстающий в начале своего хода берёт карту Лавки бесплатно, если в руке меньше трёх',
  },
  [ELaw.LAST_START_GOOD]: {
    name: 'Удача отстающего',
    rule: () => 'Отстающий в начале своего хода разыгрывает случайное событие без беды',
  },
  [ELaw.LAST_START_RESOURCE]: { name: 'Пособие', rule: resource => `Отстающий в начале своего хода: ${resource} +3` },
  [ELaw.OVERTAKE_STEAL]: { name: 'Подножка', rule: resource => `Обогнал игрока броском — забери у него: ${resource} 3` },
  [ELaw.RED_BAD]: { name: 'Дурная примета', rule: () => 'Остановился на красной — разыграй случайную беду' },
  [ELaw.RED_CHOICE]: {
    name: 'Пошлина',
    rule: resource => `Остановился на красной — отдай ${resource} 3 или отступи на 3 клетки`,
  },
  [ELaw.RED_PAY_ALL]: {
    name: 'Налог',
    rule: resource => `Остановился на красной — отдай каждому: ${resource} 2 (вдвоём — 4)`,
  },
  [ELaw.SIX_SKIP]: { name: 'Шестёрка', rule: () => 'Выпала 6 на кубике хода — пропусти следующий ход' },
};

export const HAND_LIMIT = 3;
export const SHOP_PRICE = 3;
export const SHOP_OFFER = 3;

export interface TShopCardText extends TCardText {
  kind: 'active' | 'passive';
  landsOn?: ECellType;
}

export const SHOP_TEXT: Record<EShopCard, TShopCardText> = {
  [EShopCard.CLOVER]: {
    name: 'Подкова',
    kind: 'passive',
    landsOn: ECellType.EMPTY,
    rule: resource => `Остановился на пустой: ${resource} +4`,
  },
  [EShopCard.GRENADE]: {
    name: 'Обвал',
    kind: 'active',
    rule: () => 'Ближайший впереди отступает на 6 клеток',
  },
  [EShopCard.HAND_OF_FATE]: {
    name: 'Толчок',
    kind: 'active',
    rule: () => 'Выбранный игрок отступает на 4 клетки',
  },
  [EShopCard.HARPOON]: {
    name: 'Аркан',
    kind: 'active',
    rule: () => 'Ближайший впереди, если до него не больше 10 клеток, встаёт на твою клетку',
  },
  [EShopCard.HOOK]: {
    name: 'Кошка',
    kind: 'active',
    rule: () => 'Встань на клетку ближайшего впереди, если до него не больше 10 клеток',
  },
  [EShopCard.MAGIC_DIE]: { name: 'Утяжелённый кубик', kind: 'passive', rule: () => '+1 к броску на движение' },
  [EShopCard.MONEY_MAGNET]: {
    name: 'Громоотвод',
    kind: 'passive',
    landsOn: ECellType.RED,
    rule: resource => `Остановился на красной: ${resource} +5`,
  },
  [EShopCard.ROCKET]: {
    name: 'Рывок',
    kind: 'active',
    rule: () => 'Пройди 5 клеток вперёд',
  },
  [EShopCard.TRAVELATOR]: {
    name: 'Попутка',
    kind: 'passive',
    landsOn: ECellType.EMPTY,
    rule: () => 'Остановился на пустой — пройди 4 клетки вперёд',
  },
  [EShopCard.VOODOO]: {
    name: 'Порча',
    kind: 'active',
    rule: () => 'Ближайший впереди в начале своего хода разыгрывает беду',
  },
};

export const cardName = (G: { cardNames?: Record<string, TCardName> }, id: ELaw | EShopCard): string =>
  G.cardNames?.[id]?.name ?? (id in LAW_TEXT ? LAW_TEXT[id as ELaw] : SHOP_TEXT[id as EShopCard]).name;
