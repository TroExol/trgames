export interface TSpot {
  x: number;
  y: number;
}

interface TPoint extends TSpot {
  col: number;
}

interface TTile {
  x: number;
  y: number;
  angle: number;
}

// Насколько вынесены наружу управляющие точки на развороте в конце ряда
const TURN_OUT = 70;

const round = (value: number): number => Math.round(value * 100) / 100;

// Управляющие точки обеих кривых стоят по горизонтали в одном месте. Внутри
// ряда оно отнесено на половину горизонтальной разницы, отчего получается
// пологая S. На развороте в конце ряда разницы нет, и место выносится
// наружу — выходит широкая дуга вместо скоса
const controlFor = (from: TPoint, to: TPoint): number =>
  (to.x === from.x
    ? from.x + (from.col === 0 ? -TURN_OUT : TURN_OUT)
    : from.x + (to.x - from.x) / 2);

// Связь между клетками — кубическая кривая
export const linkPath = (from: TPoint, to: TPoint): string => {
  const control = controlFor(from, to);

  return `M${round(from.x)} ${round(from.y)}`
    + `C${round(control)} ${round(from.y)} ${round(control)} ${round(to.y)} ${round(to.x)} ${round(to.y)}`;
};

// Середина связи — точка кривой при t = 0.5. По ней подпись края обходит ленту
// там, где между клетками она уходит в сторону: на развороте в конце ряда
export const linkMiddle = (from: TPoint, to: TPoint): TSpot => ({
  x: (from.x + to.x + 6 * controlFor(from, to)) / 8,
  y: (from.y + to.y) / 2,
});

// Плитка — четырёхугольник поперёк ленты, повёрнутый по ходу пути. Скругление
// делается обводкой с stroke-linejoin="round", а не радиусом: так плитки
// одного вида собираются в один path со множеством подпутей
export const tilePath = (tile: TTile, along: number, across: number): string => {
  const alongX = (Math.cos(tile.angle) * along) / 2;
  const alongY = (Math.sin(tile.angle) * along) / 2;
  const acrossX = (-Math.sin(tile.angle) * across) / 2;
  const acrossY = (Math.cos(tile.angle) * across) / 2;
  const corner = (alongSign: number, acrossSign: number): string =>
    `${round(tile.x + alongSign * alongX + acrossSign * acrossX)} `
    + `${round(tile.y + alongSign * alongY + acrossSign * acrossY)}`;

  return `M${corner(-1, -1)}L${corner(1, -1)}L${corner(1, 1)}L${corner(-1, 1)}Z`;
};

// Правильный многоугольник вокруг центра клетки: ромб — четыре вершины, шестиугольник — шесть
export const polygonPath = (center: TSpot, sides: number, radius: number, rotation = 0): string =>
  `M${Array.from({ length: sides }, (_, index) => {
    const angle = rotation + (Math.PI * 2 * index) / sides;

    return `${round(center.x + Math.cos(angle) * radius)} ${round(center.y + Math.sin(angle) * radius)}`;
  }).join('L')}Z`;

// Домик Лавки: крыша вверх, не зависит от угла пути
export const housePath = (center: TSpot): string =>
  `M${round(center.x - 20)} ${round(center.y - 4)}L${round(center.x)} ${round(center.y - 24)}`
  + `L${round(center.x + 20)} ${round(center.y - 4)}V${round(center.y + 18)}H${round(center.x - 20)}Z`;
