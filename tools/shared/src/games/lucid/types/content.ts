import type { TOption } from './effect';

export type TTheme = {
  name: string;
  resourceName: string;
  palette: string[];
};

export type TEvent = {
  cellId: number;
  title: string;
  text: string;
  options: TOption[];
};

// Всё, что генерирует нейросеть для одной партии
export type TPartyContent = {
  theme: TTheme;
  events: Record<number, TEvent>;
};
