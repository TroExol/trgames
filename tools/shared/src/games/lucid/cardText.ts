import { ELaw } from './types/cards';

export interface TCardText {
  name: string;
  rule: (resourceName: string) => string;
}

export const LAW_TEXT: Record<ELaw, TCardText> = {
  [ELaw.DOUBLE_AGAIN]: { name: 'Дубль', rule: () => 'Выпали два одинаковых кубика — ходи ещё раз' },
  [ELaw.GREEN_ADVANCE]: { name: 'Тропа', rule: () => 'Остановился на зелёной — пройди 7 клеток вперёд, клетка сработает' },
  [ELaw.GREEN_AGAIN]: { name: 'Второе дыхание', rule: () => 'Остановился на зелёной — ходи ещё раз' },
  [ELaw.GREEN_GOOD]: { name: 'Добрый знак', rule: () => 'Остановился на зелёной — разыграй случайное событие без беды' },
  [ELaw.GREEN_RESOURCE]: { name: 'Урожай', rule: resource => `Остановился на зелёной: ${resource} +5` },
  [ELaw.LAST_END_ADVANCE]: {
    name: 'Попутный ветер',
    rule: () => 'Отстающий в конце своего хода проходит 5 клеток вперёд, клетка сработает',
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
