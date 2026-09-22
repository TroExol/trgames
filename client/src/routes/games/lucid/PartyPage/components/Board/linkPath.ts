interface TPoint {
  x: number;
  y: number;
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

// Связь между клетками — кубическая кривая. Внутри ряда управляющие точки
// отнесены на половину горизонтальной разницы, отчего получается пологая S
export const linkPath = (from: TPoint, to: TPoint): string => {
  const dx = to.x - from.x;
  // Разворот в конце ряда: горизонтальной разницы нет, и управляющие точки
  // выносятся наружу — выходит широкая дуга вместо скоса
  const control = dx === 0
    ? from.x + (from.col === 0 ? -TURN_OUT : TURN_OUT)
    : from.x + dx / 2;

  return `M${round(from.x)} ${round(from.y)}`
    + `C${round(control)} ${round(from.y)} ${round(control)} ${round(to.y)} ${round(to.x)} ${round(to.y)}`;
};

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
