import type { TOption } from './effect';

export interface TTheme {
  name: string;
  resourceName: string;
  palette: string[];
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
