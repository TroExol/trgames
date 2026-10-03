export enum ECellType {
  EMPTY = 'EMPTY',
  EVENT = 'EVENT',
  FINISH = 'FINISH',
  GREEN = 'GREEN',
  PORTAL = 'PORTAL',
  RED = 'RED',
  START = 'START',
}

// Портал ведёт на парную клетку; pair — номер пары, по нему клиент красит обе
export interface TPortal {
  pair: number;
  to: number;
}

export interface TCell {
  id: number;
  type: ECellType;
  // Клетки, куда можно шагнуть дальше. Больше одной — развилка. Всегда больше id
  next: number[];
  portal?: TPortal;
}

export interface TTrack {
  cells: TCell[];
  startId: number;
  finishId: number;
}
