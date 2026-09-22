import type { TOption } from './effect';

// Настроение мира. Поле решает сразу две задачи: светлая партия или тёмная
// по палитре и какая играет музыка. Вывести настроение из средней светлоты
// палитры было бы бесплатно, но для музыки светлота — плохой признак:
// бледный мир жуткого цирка получил бы бодрую дорожку
export enum EThemeMood {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
}

export interface TTheme {
  name: string;
  resourceName: string;
  palette: string[];
  // Необязательное: модель может его не прислать, и клиент обходится без него
  mood?: EThemeMood;
}

export interface TEvent {
  // Номер клетки хранится также в самом событии, хотя события лежат в словаре по этому ключу.
  // Необходимо для отправки события отдельно от словаря. Ключ словаря и это поле обязаны совпадать.
  cellId: number;
  title: string;
  text: string;
  options: TOption[];
}

// Всё, что генерирует нейросеть для одной партии
export interface TPartyContent {
  theme: TTheme;
  events: Record<number, TEvent>;
}
