import type { LucidShared } from '@trgames/shared';

import { useMediaQuery, useResizeObserver } from 'usehooks-ts';
import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { cellsPerRow, layoutTrack } from '@/lib/lucid/trackLayout';

import { linkPath } from './linkPath';

export interface TBoardProps {
  state: LucidShared.TStateForPlayer;
  // Вызывается только для клеток из branchChoices: другие клетки не нажимаются
  onSelectCell?: (cellId: number) => void;
}

// Размеры в условных единицах раскладки, где клетка отстоит от клетки на 100
const LINE_WIDTH = 10;
const CELL_RADIUS = 14;
// Сторона скруглённого квадрата старта и финиша
const EDGE_SIZE = 34;
const CHOICE_RADIUS = 22;
// Невидимая область нажатия шире кольца: пальцем в кольцо не попасть. Шире
// половины расстояния между прядями развилки делать нельзя — сольются
const HIT_RADIUS = 34;
const TOKEN_RADIUS = 10;
// Насколько расходятся фишки, стоящие на одной клетке
const TOKEN_SPREAD = 12;
const LABEL_SIZE = 20;
const LABEL_GAP = 24;
// Поля вокруг трека: ник над верхним рядом и скос разворота не должны обрезаться
const PAD_X = 16;
const PAD_TOP = 34;
const DRAW_MS = 1200;

export const Board = observer(function Board({ state, onSelectCell }: TBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<SVGPathElement>(null);
  const isDrawn = useRef(false);
  const { width } = useResizeObserver({ ref: containerRef, box: 'border-box' });
  const isReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const layout = layoutTrack(state.G.track, cellsPerRow(width ?? 0));
  // Все связи одной линией: трек прочерчивается от старта к финишу единым
  // движением, а не рассыпается на отрезки
  const trackD = layout.links
    .map(link => linkPath(layout.byId[link.from], layout.byId[link.to]))
    .join(' ');

  // Прочерчивание — событие начала партии, а не отклик на перерисовку: оно
  // случается один раз, поэтому у эффекта нет списка зависимостей, а есть флаг
  useEffect(() => {
    const path = trackRef.current;

    if (!path || isDrawn.current || isReducedMotion) {
      return;
    }

    isDrawn.current = true;

    const length = path.getTotalLength();

    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    // Принудительная перекомпоновка: без неё браузер склеит оба присваивания
    // и перехода не случится
    path.getBoundingClientRect();
    path.style.transition = `stroke-dashoffset ${DRAW_MS}ms ease-out`;
    path.style.strokeDashoffset = '0';
  });

  const visited = new Set(state.G.visited);
  // Фишки нескольких игроков на одной клетке расходятся по кругу, иначе
  // верхняя закрывает собой все остальные
  const groups = new Map<number, LucidShared.TPlayerId[]>();

  state.G.order.forEach(playerId => {
    const { position } = state.G.players[playerId];

    groups.set(position, [...(groups.get(position) ?? []), playerId]);
  });

  return (
    <div className="w-full" ref={containerRef}>
      {width
        ? (
            <svg
              className="block h-auto w-full"
              preserveAspectRatio="xMidYMid meet"
              viewBox={`${-PAD_X} ${-PAD_TOP} ${layout.width + PAD_X * 2} ${layout.height + PAD_TOP}`}
            >
              <title>{`Трек мира «${state.G.theme.name}»`}</title>

              {/* Линия одной толщины на всём протяжении: путь равноправен */}
              <path
                d={trackD}
                fill="none"
                ref={trackRef}
                stroke="var(--lucid-line)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={LINE_WIDTH}
              />

              {layout.cells.map(cell => {
                const isEdge = cell.id === state.G.track.startId || cell.id === state.G.track.finishId;
                const fill = visited.has(cell.id) ? 'var(--lucid-line)' : 'var(--lucid-base)';

                return isEdge
                  ? (
                      <rect
                        fill={fill}
                        height={EDGE_SIZE}
                        key={cell.id}
                        rx={10}
                        stroke="var(--lucid-line)"
                        strokeWidth={5}
                        width={EDGE_SIZE}
                        x={cell.x - EDGE_SIZE / 2}
                        y={cell.y - EDGE_SIZE / 2}
                      />
                    )
                  : (
                      <circle
                        cx={cell.x}
                        cy={cell.y}
                        fill={fill}
                        key={cell.id}
                        r={CELL_RADIUS}
                        stroke="var(--lucid-line)"
                        strokeWidth={5}
                      />
                    );
              })}

              {state.G.branchChoices.map(cellId => {
                const cell = layout.byId[cellId];

                if (!cell) {
                  return null;
                }

                return (
                  <g
                    aria-label="Пойти по этой ветке"
                    className="cursor-pointer"
                    key={cellId}
                    onClick={() => onSelectCell?.(cellId)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectCell?.(cellId);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <circle cx={cell.x} cy={cell.y} fill="transparent" r={HIT_RADIUS} />
                    <circle
                      cx={cell.x}
                      cy={cell.y}
                      fill="none"
                      r={CHOICE_RADIUS}
                      stroke="var(--lucid-accent)"
                      strokeWidth={5}
                    />
                  </g>
                );
              })}

              {Array.from(groups).flatMap(([position, playerIds]) => playerIds.map((playerId, index) => {
                const cell = layout.byId[position];

                if (!cell) {
                  return null;
                }

                const angle = ((index * 360) / playerIds.length) * (Math.PI / 180);
                const spread = playerIds.length > 1 ? TOKEN_SPREAD : 0;
                const x = cell.x + Math.cos(angle) * spread;
                const y = cell.y + Math.sin(angle) * spread;
                const isCurrent = playerId === state.ctx.currentPlayer;

                return (
                  <g key={playerId}>
                    <circle
                      cx={x}
                      cy={y}
                      fill="var(--lucid-text)"
                      r={TOKEN_RADIUS}
                      stroke="var(--lucid-base)"
                      strokeWidth={3}
                    />

                    {/* Чей ход: кольцо вокруг фишки, отделённое от неё зазором
                        цвета основы. Красить саму фишку акцентом нельзя — на
                        палитре, где акцент и текст совпали, метка пропадёт */}
                    {isCurrent
                      ? (
                          <circle
                            cx={x}
                            cy={y}
                            fill="none"
                            r={TOKEN_RADIUS + 6}
                            stroke="var(--lucid-accent)"
                            strokeWidth={4}
                          />
                        )
                      : null}

                    {/* Обводка цветом основы: ник читается и поверх линии трека.
                        Ники стоящих на одной клетке идут стопкой над её центром:
                        рядом они накладываются друг на друга и не читаются оба */}
                    <text
                      className="font-golos"
                      fill="var(--lucid-text)"
                      fontSize={LABEL_SIZE}
                      fontWeight={playerId === state.you ? 600 : 400}
                      paintOrder="stroke"
                      stroke="var(--lucid-base)"
                      strokeWidth={4}
                      textAnchor="middle"
                      x={cell.x}
                      y={cell.y - LABEL_GAP - index * (LABEL_SIZE + 4)}
                    >
                      {state.G.players[playerId].nickname}
                    </text>
                  </g>
                );
              }))}
            </svg>
          )
        : null}
    </div>
  );
});
