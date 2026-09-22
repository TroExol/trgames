interface TPoint {
  x: number;
  y: number;
  col: number;
}

// Длина скоса на развороте в конце ряда
const TURN = 28;

const round = (value: number): number => Math.round(value * 100) / 100;

export const linkPath = (from: TPoint, to: TPoint): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dy === 0) {
    return `M${round(from.x)} ${round(from.y)}H${round(to.x)}`;
  }

  // Разворот в конце ряда: выходим наружу скосом, идём вниз, возвращаемся скосом
  if (dx === 0) {
    const step = Math.min(TURN, Math.abs(dy) / 2);
    const side = from.col === 0 ? -1 : 1;
    const down = Math.sign(dy);

    return `M${round(from.x)} ${round(from.y)}`
      + `L${round(from.x + side * step)} ${round(from.y + down * step)}`
      + `V${round(to.y - down * step)}`
      + `L${round(to.x)} ${round(to.y)}`;
  }

  const side = Math.sign(dx);
  const diagonal = Math.min(Math.abs(dy), Math.abs(dx));
  const straight = Math.abs(dx) - diagonal;

  return `M${round(from.x)} ${round(from.y)}`
    + `H${round(from.x + side * straight)}`
    + `L${round(to.x)} ${round(to.y)}`;
};
