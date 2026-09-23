import type { LucidShared } from '@trgames/shared';

import { useMediaQuery, useResizeObserver } from 'usehooks-ts';
import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import type { TMood } from '@/lib/lucid/colors';

import {
  CELL_STEP,
  cellsPerRowFor,
  depthCount,
  layoutTrack,
  ROW_STEP,
} from '@/lib/lucid/trackLayout';
import { hashString } from '@/lib/lucid/theme';
import { regionForDepth, resolveRegions } from '@/lib/lucid/regions';
import { deriveRoles } from '@/lib/lucid/colors';

import type { TSpot } from './linkPath';

import {
  linkMiddle,
  linkPath,
  tilePath,
} from './linkPath';

export interface TBoardProps {
  state: LucidShared.TStateForPlayer;
  // Вызывается только для клеток из branchChoices: другие клетки не нажимаются
  onSelectCell?: (cellId: number) => void;
  // Клик по посещённой клетке с историей — открыть её просмотр (5 в задаче).
  // Не пересекается с onSelectCell: branchChoices — клетки, куда ещё только
  // предстоит шагнуть, в cellHistory их по определению ещё нет
  onViewCell?: (cellId: number) => void;
}

// Размеры в условных единицах раскладки, где клетка отстоит от клетки на 132
const RIBBON_WIDTH = 30;
// Плитка события: вдоль пути на поперёк
const TILE_ALONG = 36;
const TILE_ACROSS = 28;
// Старт и финиш крупнее и квадратные: у пути есть начало и конец, и это видно
// без подписей
const EDGE_SIZE = 42;
// Скругление делается обводкой, а не радиусом: два — почти угол
const TILE_STROKE = 2;
const TILE_FILL_VISITED = 0.95;
// Насколько обводка выбора шире самой плитки
const CHOICE_GROWTH = 12;
// Невидимая область нажатия шире плитки: пальцем в неё не попасть. Шире
// половины расстояния между прядями развилки делать нельзя — сольются
const HIT_RADIUS = 36;
const TOKEN_RADIUS = 11;
// Насколько расходятся фишки, стоящие на одной клетке
const TOKEN_SPREAD = 14;
const LABEL_SIZE = 15;
const LABEL_GAP = 30;
// Подложка края — воздух, а не второй предмет внимания: та же лента, только
// шире и почти прозрачная
const BACKDROP_OPACITY = 0.07;
const BACKDROP_GROWTH = 2.5;
// Поля вокруг трека: ник над верхним рядом и подложка края не должны обрезаться
const PAD_X = 46;
const PAD_TOP = 50;
const PAD_BOTTOM = 46;
// Ниже этого размера подпись не читается, сколько бы клеток ни влезло в ряд
const MIN_TEXT_PX = 12;
// Предел растяжения промежутка между рядами
const ROW_STRETCH = 1.5;
const DRAW_MS = 1400;

// Ширина картинки известна до укладки: по ней считается растяжение рядов
const viewWidthFor = (perRow: number): number => perRow * CELL_STEP + PAD_X * 2;

export const Board = observer(function Board({ state, onSelectCell, onViewCell }: TBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ribbonRefs = useRef<(SVGPathElement | null)[]>([]);
  const isDrawn = useRef(false);
  const { width = 0, height = 0 } = useResizeObserver({ ref: containerRef, box: 'border-box' });
  const isReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const { theme, track } = state.G;
  const roles = deriveRoles(theme.palette, theme.mood as TMood | undefined);
  // Края мира: цвет кодирует место, а не содержимое клетки — содержимое секрет
  // до посещения. У партий, сгенерированных до краёв, список пуст, и путь
  // красится одной линией
  const regions = resolveRegions(theme.regions ?? [], roles.base);
  const trackDepth = depthCount(track);
  const perRow = cellsPerRowFor(width, height, trackDepth);
  const rows = Math.max(Math.ceil(trackDepth / perRow), 1);
  // Клеток в ряду целое число, и раскладка в пропорцию экрана точно не
  // попадает: на узком экране доска упирается в ширину и не добирает по
  // высоте. Остаток высоты раздаётся промежуткам между рядами — дальше
  // полутора обычных шаг не растягивается, иначе выходит лестница
  const rowStep = Math.min(
    ROW_STEP * ROW_STRETCH,
    Math.max(ROW_STEP, (viewWidthFor(perRow) * (height / Math.max(width, 1))
      - ROW_STEP - PAD_TOP - PAD_BOTTOM) / Math.max(rows - 1, 1)),
  );
  const layout = layoutTrack(track, perRow, hashString(theme.name), rowStep);
  const regionAt = (depth: number) => regionForDepth(regions, depth, layout.maxDepth);

  const viewWidth = layout.width + PAD_X * 2;
  const viewHeight = layout.height + PAD_TOP + PAD_BOTTOM;
  // Поле ужимается под экран целиком, и на телефоне пятнадцать условных единиц
  // превращаются в семь пикселей. Подписи растут обратно масштабу: читаемость
  // не должна зависеть от того, сколько клеток влезло в ряд
  const scale = Math.min(width / viewWidth, height / viewHeight) || 1;
  const textSize = Math.max(LABEL_SIZE, MIN_TEXT_PX / scale);

  // Лента режется по краям: связь красится цветом края своей начальной клетки.
  // Один path на край — и он же единица прочерчивания
  const ribbons = (regions.length > 0
    ? regions.map(region => ({
        color: region.ribbon,
        links: layout.links.filter(link => regionAt(layout.byId[link.from].depth) === region),
      }))
    : [{ color: 'var(--lucid-line)', links: layout.links }])
    .map(ribbon => ({
      color: ribbon.color,
      d: ribbon.links
        .map(link => linkPath(layout.byId[link.from], layout.byId[link.to]))
        .join(' '),
    }))
    .filter(ribbon => ribbon.d.length > 0);

  const visited = new Set(state.G.visited);
  // Плитки одного вида собираются в один path со множеством подпутей: их
  // полсотни, и каждая отдельным элементом ничего не добавляет
  const tiles = new Map<string, { d: string; fill: string; ink: string; isVisited: boolean }>();

  layout.cells.forEach(cell => {
    const region = regionAt(cell.depth);
    const ink = region?.ink ?? 'var(--lucid-line)';
    const isVisited = visited.has(cell.id);
    const isEdge = cell.id === track.startId || cell.id === track.finishId;
    const key = `${ink}:${isVisited}`;
    const d = isEdge
      ? tilePath(cell, EDGE_SIZE, EDGE_SIZE)
      : tilePath(cell, TILE_ALONG, TILE_ACROSS);

    tiles.set(key, {
      d: [tiles.get(key)?.d, d].filter(Boolean).join(' '),
      fill: isVisited ? ink : region?.hollow ?? 'var(--lucid-base)',
      ink,
      isVisited,
    });
  });

  // Фишки нескольких игроков на одной клетке расходятся по кругу, иначе
  // верхняя закрывает собой все остальные
  const groups = new Map<number, LucidShared.TPlayerId[]>();

  state.G.order.forEach(playerId => {
    const { position } = state.G.players[playerId];

    groups.set(position, [...(groups.get(position) ?? []), playerId]);
  });

  // Точки, которых подпись края сторонится: центры клеток, середины связей и
  // ники. Этого хватает, чтобы не наехать ни на соседний ряд, ни на прядь
  // развилки, ни на чужую подпись
  const busy = [
    ...layout.cells,
    ...layout.links.map(link => linkMiddle(layout.byId[link.from], layout.byId[link.to])),
    // Ники стоят над своими клетками — подпись обходит и их
    ...Array.from(groups.keys()).flatMap(position => {
      const cell = layout.byId[position];

      return cell ? [{ x: cell.x, y: cell.y - LABEL_GAP }] : [];
    }),
  ];

  // Подпись края стоит у его первой клетки и отходит поперёк пути: на ленте её
  // не прочесть, а вдоль пути её перечеркнёт соседний ряд. Поперечное
  // направление — угол касательной в клетке, повёрнутый на прямой угол
  const labels = regions.flatMap(region => {
    const owned = layout.cells
      .filter(cell => regionAt(cell.depth) === region)
      .sort((first, second) => first.depth - second.depth);

    if (owned.length === 0) {
      return [];
    }

    const gap = RIBBON_WIDTH / 2 + textSize;
    // Размеры строки на глаз: две трети кегля на букву в ширину и полтора
    // кегля в высоту
    const halfWidth = (region.name.length * textSize) / 3;
    const halfHeight = textSize * 0.75;
    // Сначала обе стороны от первой клетки, потом вдвое дальше от неё, и лишь
    // потом следующие клетки: на развороте ряда поперечное направление
    // смотрит в соседний ряд, и у первой клетки места не остаётся
    const points = owned.slice(0, 5).flatMap(cell => [1, -1, 2, -2].map(side => ({
      x: cell.x + Math.cos(cell.angle + Math.PI / 2) * gap * side,
      y: cell.y + Math.sin(cell.angle + Math.PI / 2) * gap * side,
    })));
    // Насколько подпись разошлась с лентой: отрицательное — легла на неё
    const clearance = (point: TSpot): number => Math.min(...busy.map(spot => Math.max(
      Math.abs(spot.x - point.x) - halfWidth - TILE_ALONG / 2,
      Math.abs(spot.y - point.y) - halfHeight - RIBBON_WIDTH / 2,
    )));
    // На узком экране смещённая подпись вылезает за край картинки — тогда она
    // уходит на другую сторону ленты
    const inside = (point: TSpot): boolean =>
      point.x - halfWidth >= -PAD_X
      && point.x + halfWidth <= layout.width + PAD_X
      && point.y - halfHeight >= -PAD_TOP
      && point.y + halfHeight <= layout.height + PAD_BOTTOM;
    // Первое подошедшее место, а если не подошло ни одно — самое просторное
    const point = points.find(candidate => inside(candidate) && clearance(candidate) > 0)
      ?? points.reduce((best, candidate) => (clearance(candidate) > clearance(best) ? candidate : best));

    // Поставленная подпись занимает место: её концы становятся занятыми
    // точками, и соседний край уводит свою подпись в другое
    busy.push({ x: point.x - halfWidth, y: point.y }, { x: point.x + halfWidth, y: point.y });

    return [{ ink: region.ink, name: region.name, x: point.x, y: point.y }];
  });

  // Прочерчивание — событие начала партии, а не отклик на перерисовку: оно
  // случается один раз, поэтому у эффекта нет списка зависимостей, а есть флаг.
  // Края чертятся подряд, от старта к финишу, а не разом
  useEffect(() => {
    const paths = ribbonRefs.current.filter((path): path is SVGPathElement => path !== null);

    if (paths.length === 0 || isDrawn.current || isReducedMotion) {
      return;
    }

    isDrawn.current = true;

    const lengths = paths.map(path => path.getTotalLength());
    const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
    let passed = 0;

    paths.forEach((path, index) => {
      path.style.strokeDasharray = `${lengths[index]}`;
      path.style.strokeDashoffset = `${lengths[index]}`;
      // Принудительная перекомпоновка: без неё браузер склеит оба присваивания
      // и перехода не случится
      path.getBoundingClientRect();
      path.style.transition = `stroke-dashoffset ${(DRAW_MS * lengths[index]) / total}ms`
        + ` linear ${(DRAW_MS * passed) / total}ms`;
      path.style.strokeDashoffset = '0';
      passed += lengths[index];
    });
  });

  return (
    <div className="size-full" ref={containerRef}>
      {width
        ? (
            <svg
              className="block size-full"
              preserveAspectRatio="xMidYMid meet"
              viewBox={`${-PAD_X} ${-PAD_TOP} ${viewWidth} ${viewHeight}`}
            >
              <title>{`Трек мира «${theme.name}»`}</title>

              {/* Подложка края — сама его лента, только шире и почти прозрачная.
                  Край змеится через несколько рядов, и описанный вокруг его
                  клеток прямоугольник залезал бы на чужие отрезки пути.
                  Ключ по порядку: имена и цвета краёв приходят от модели и
                  могут совпасть */}
              {regions.length > 0
                ? ribbons.map((ribbon, index) => (
                    <path
                      d={ribbon.d}
                      fill="none"
                      key={index}
                      opacity={BACKDROP_OPACITY}
                      stroke={ribbon.color}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={RIBBON_WIDTH * BACKDROP_GROWTH}
                    />
                  ))
                : null}

              {/* Лента одной толщины на всём протяжении: путь равноправен */}
              {ribbons.map((ribbon, index) => (
                <path
                  d={ribbon.d}
                  fill="none"
                  key={index}
                  ref={element => {
                    ribbonRefs.current[index] = element;
                  }}
                  stroke={ribbon.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={RIBBON_WIDTH}
                />
              ))}

              {Array.from(tiles).map(([key, tile]) => (
                <path
                  d={tile.d}
                  fill={tile.fill}
                  fillOpacity={tile.isVisited ? TILE_FILL_VISITED : 1}
                  key={key}
                  stroke={tile.ink}
                  strokeLinejoin="round"
                  strokeWidth={TILE_STROKE}
                />
              ))}

              {/* Подпись края поверх ленты и в обводке основы: место ей
                  подобрано в стороне от пути, но фишка или чужой ряд могут
                  подойти вплотную, и под лентой её было бы не прочесть */}
              {labels.map((label, index) => (
                <text
                  className="font-golos"
                  dominantBaseline="middle"
                  fill={label.ink}
                  fontSize={textSize}
                  key={index}
                  letterSpacing={0.4}
                  paintOrder="stroke"
                  stroke="var(--lucid-base)"
                  strokeWidth={4}
                  textAnchor="middle"
                  x={label.x}
                  y={label.y}
                >
                  {label.name}
                </text>
              ))}

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
                    <path
                      d={tilePath(cell, TILE_ALONG + CHOICE_GROWTH, TILE_ACROSS + CHOICE_GROWTH)}
                      fill="none"
                      stroke="var(--lucid-accent)"
                      strokeLinejoin="round"
                      strokeWidth={4}
                    />
                  </g>
                );
              })}

              {/* Просмотр клетки: только там, где уже что-то разыграно —
                  клетка без записи в cellHistory нечего показывать, и это
                  само собой исключает и непосещённые клетки, и клетку
                  текущего нерешённого события (запись появляется только
                  после выбора) */}
              {layout.cells.filter(cell => (state.G.cellHistory[cell.id]?.length ?? 0) > 0).map(cell => (
                <g
                  aria-label="Посмотреть клетку"
                  className="cursor-pointer"
                  key={`view-${cell.id}`}
                  onClick={() => onViewCell?.(cell.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onViewCell?.(cell.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <circle cx={cell.x} cy={cell.y} fill="transparent" r={HIT_RADIUS} />
                </g>
              ))}

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
                            r={TOKEN_RADIUS + 10}
                            stroke="var(--lucid-accent)"
                            strokeWidth={4}
                          />
                        )
                      : null}

                    {/* Обводка цветом основы: ник читается и поверх ленты.
                        Ники стоящих на одной клетке идут стопкой над её центром:
                        рядом они накладываются друг на друга и не читаются оба */}
                    <text
                      className="font-golos"
                      fill="var(--lucid-text)"
                      fontSize={textSize}
                      fontWeight={playerId === state.you ? 600 : 400}
                      paintOrder="stroke"
                      stroke="var(--lucid-base)"
                      strokeWidth={4}
                      textAnchor="middle"
                      x={cell.x}
                      y={cell.y - LABEL_GAP - index * (textSize + 4)}
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
