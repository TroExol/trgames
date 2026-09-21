export enum ECellType {
  EVENT = 'EVENT',
  FINISH = 'FINISH',
  START = 'START',
}

export type TCell = {
  id: number;
  type: ECellType;
  // Клетки, куда можно шагнуть дальше. Больше одной — развилка. Всегда больше id
  next: number[];
};

export type TTrack = {
  cells: TCell[];
  startId: number;
  finishId: number;
};
