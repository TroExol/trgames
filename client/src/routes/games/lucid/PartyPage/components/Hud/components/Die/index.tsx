import type { LucidShared } from '@trgames/shared';

import { observer } from 'mobx-react-lite';

interface TProps {
  roll?: LucidShared.TRoll;
}

// Точки грани по сетке 3×3. Цифра рядом дублирует их намеренно: на маленьком
// экране точки читаются хуже
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

const SIZE = 36;
const PIP_RADIUS = 3;
const PIP_ORIGIN = 9;
const PIP_STEP = 9;

export const Die = observer(function Die({ roll }: TProps) {
  const pips = roll ? PIPS[roll.value] ?? [] : [];

  return (
    // Броска ещё не было — кубик погашен, но остаётся на месте: полоса не
    // должна перестраиваться от первого хода
    <div className="flex shrink-0 items-center gap-2" style={{ opacity: roll ? 1 : 0.35 }}>
      <svg height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE}>
        <title>{roll ? `Выпало ${roll.value}` : 'Кубик ещё не бросали'}</title>
        <rect
          fill="none"
          height={SIZE - 4}
          rx={8}
          stroke="var(--lucid-line)"
          strokeWidth={2}
          width={SIZE - 4}
          x={2}
          y={2}
        />
        {pips.map(([col, row]) => (
          <circle
            cx={PIP_ORIGIN + col * PIP_STEP}
            cy={PIP_ORIGIN + row * PIP_STEP}
            fill="var(--lucid-text)"
            key={`${col}:${row}`}
            r={PIP_RADIUS}
          />
        ))}
      </svg>

      <div className="flex flex-col gap-0.5">
        <span className="font-unbounded text-lg leading-none">{roll ? roll.value : '—'}</span>

        {/* Порог — часть решения, а не сноска: по нему игрок и выбирал вариант */}
        {roll?.threshold !== undefined && (
          <span className="text-xs leading-none" style={{ color: 'var(--lucid-muted)' }}>
            {`порог ${roll.threshold} · ${roll.value >= roll.threshold ? 'взят' : 'не взят'}`}
          </span>
        )}
      </div>
    </div>
  );
});
