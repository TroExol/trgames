import type { TOption, TOptionView } from './effect';
import type { TThemeIcon } from '../themeIcons';

// Настроение мира. Поле решает сразу две задачи: светлая партия или тёмная
// по палитре и какая играет музыка. Вывести настроение из средней светлоты
// палитры было бы бесплатно, но для музыки светлота — плохой признак:
// бледный мир жуткого цирка получил бы бодрую дорожку
export enum EThemeMood {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
}

// Край мира: участок пути со своим названием и цветом. Нужен, чтобы дорога
// шла через разные места, как на бумажной доске, — но, в отличие от неё, цвет
// здесь ничего не говорит о содержимом клеток: оно секрет до посещения
export interface TRegion {
  name: string;
  color: string;
}

export interface TTheme {
  name: string;
  resourceName: string;
  palette: string[];
  // Необязательное: модель может его не прислать, и клиент обходится без него
  mood?: EThemeMood;
  // Три-пять краёв по порядку следования от старта к финишу.
  // Необязательно: у партий, сгенерированных раньше, поля нет
  regions?: TRegion[];
  // Три-пять значков для плитки на фоне. Необязательно: у прежних партий поля нет
  icons?: TThemeIcon[];
}

export interface TEvent {
  // Номер клетки хранится также в самом событии, хотя события лежат в словаре по этому ключу.
  // Необходимо для отправки события отдельно от словаря. Ключ словаря и это поле обязаны совпадать.
  cellId: number;
  title: string;
  text: string;
  options: TOption[];
}

// Событие глазами игрока — вариантами в форме TOptionView (5.5)
export interface TEventView {
  cellId: number;
  title: string;
  text: string;
  options: TOptionView[];
}

export interface TCardName {
  name: string;
  flavor: string;
}

// Всё, что генерирует нейросеть для одной партии
export interface TPartyContent {
  theme: TTheme;
  events: Record<number, TEvent>;
  cardNames?: Record<string, TCardName>;
}
