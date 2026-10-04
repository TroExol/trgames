import { useMediaQuery, useResizeObserver } from 'usehooks-ts';
import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import type { TMood } from '@/lib/lucid/colors';
import type { TCellIcon, TCellShape } from '@/lib/lucid/cellLook';

import {
  CELL_STEP,
  cellsPerRowFor,
  depthCount,
  layoutTrack,
  ROW_STEP,
} from '@/lib/lucid/trackLayout';
import { hashString } from '@/lib/lucid/theme';
import { resolveRegions } from '@/lib/lucid/regions';
import { deriveRoles } from '@/lib/lucid/colors';
import {
  cellLook,
  SAFE_LABEL,
  ZONE_LABEL,
  zoneStarts,
} from '@/lib/lucid/cellLook';
import { cellHint } from '@/lib/lucid/cellHint';

import type { TSpot } from './linkPath';

import {
  housePath,
  linkMiddle,
  linkPath,
  polygonPath,
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
const HINT_MS = 4000;
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
const DIAMOND_RADIUS = 25;
const HEX_RADIUS = 24;
const DOT_RADIUS = 9;
const DISC_RADIUS = 18;
const PORTAL_OUTER_RADIUS = 23;
const PORTAL_INNER_RADIUS = 13;
const WHITE = '#ffffff';
// Толщина обводки по форме
const SHAPE_STROKE: Record<TCellShape, number> = {
  diamond: 2.5,
  disc: 2,
  dot: 2.5,
  hex: 2,
  house: 2,
  portal: 5,
  tile: TILE_STROKE,
};
// Пиктограммы нарисованы в квадрате 24×24 вокруг нуля; здесь их сдвиг вниз и размер
const ICON_SPEC: Record<TCellIcon, { dy: number; size: number }> = {
  FINISH: { dy: 0, size: 1.2 },
  GREEN: { dy: 0, size: 1 },
  LAW: { dy: 0, size: 0.95 },
  RED: { dy: 0, size: 1 },
  SHOP: { dy: 4, size: 0.9 },
  START: { dy: 0, size: 1.2 },
};
const ICON_PATHS: Record<TCellIcon, JSX.Element> = {
  FINISH: (
    <>
      <rect height="16" rx="2" width="16" x="-8" y="-8" />
      <circle r="4" />
      <path d="M0 -4v-2" />
    </>
  ),
  GREEN: <path d="M-6 0h12M0 -6v12" />,
  LAW: (
    <>
      <path d="M0 -8v15M-5 7h10M-8 -5h16" />
      <path d="M-8 -5l-3 6h6zM8 -5l-3 6h6z" />
    </>
  ),
  RED: <path d="M-6 0h12" />,
  SHOP: (
    <>
      <path d="M-7 -2h14l-1.6 10h-10.8z" />
      <path d="M-3.5 -2v-2.5a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  START: <path d="M-5 9v-18M-5 -8h11l-3 4l3 4h-11" />,
};
// Насколько пиктограммы и знаки растут на телефоне вместе с подписями; больше
// не растут, иначе не влезут в форму
const ICON_BOOST_MAX = 1.25;
const MARK_SIZE = 22;
const PORTAL_MARK_SIZE = 16;
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
// Фишка не прыгает между клетками — плавный переход cx/cy. Раскладка не
// меняет координаты клетки при ресайзе (масштаб — на viewBox), поэтому
// переход срабатывает только на настоящем перемещении фишки, не на ресайзе.
// Точный путь клетка за клеткой даёт вызывающий код (PartyStore, показ
// броска, задача 1): он выставляет позицию игрока пошагово, а тут это
// просто честно доезжает CSS-переходом
const TOKEN_TRANSITION_MS = 150;

// Ширина картинки известна до укладки: по ней считается растяжение рядов
const viewWidthFor = (perRow: number): number => perRow * CELL_STEP + PAD_X * 2;

export const Board = observer(function Board({ state, onSelectCell, onViewCell }: TBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ribbonRefs = useRef<(SVGPathElement | null)[]>([]);
  const isDrawn = useRef(false);
  const { width = 0, height = 0 } = useResizeObserver({ ref: containerRef, box: 'border-box' });
  const isReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const hintRef = useRef<HTMLParagraphElement>(null);
  const [hintCellId, setHintCellId] = useState<number>();

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
  const regionAt = (depth: number) => LucidShared.regionForDepth(regions, depth, layout.maxDepth);

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
  const boost = Math.min(Math.max(textSize / LABEL_SIZE, 1), ICON_BOOST_MAX);
  // Формы-пути одного вида собираются в один path со множеством подпутей: их
  // полсотни, и каждая отдельным элементом ничего не добавляет. Круги и
  // пиктограммы рисуются отдельными элементами
  const tiles = new Map<string, { d: string; fill: string; ink: string; isVisited: boolean; width: number }>();
  const cellById = new Map(track.cells.map(cell => [cell.id, cell]));
  const marks: { id: number; node: JSX.Element }[] = [];

  layout.cells.forEach(cell => {
    const region = regionAt(cell.depth);
    const ink = region?.ink ?? 'var(--lucid-line)';
    const hollow = region?.hollow ?? 'var(--lucid-base)';
    const isVisited = visited.has(cell.id);
    const look = cellLook(cellById.get(cell.id)!, isVisited);
    const isInk = look.fill === 'ink';
    const fill = isInk ? ink : look.fill === 'hollow' ? hollow : look.fill;
    const outline = SHAPE_STROKE[look.shape];
    const pathByShape: Partial<Record<TCellShape, string>> = {
      diamond: polygonPath(cell, 4, DIAMOND_RADIUS),
      hex: polygonPath(cell, 6, HEX_RADIUS, Math.PI / 6),
      house: housePath(cell),
      tile: tilePath(cell, EDGE_SIZE, EDGE_SIZE),
    };
    const d = pathByShape[look.shape];

    if (d) {
      const key = `${ink}:${fill}:${isInk}:${outline}`;

      tiles.set(key, {
        d: [tiles.get(key)?.d, d].filter(Boolean).join(' '),
        fill,
        ink,
        isVisited: isInk,
        width: outline,
      });
    }

    if (look.shape === 'dot') {
      marks.push({
        id: cell.id,
        node: <circle cx={cell.x} cy={cell.y} fill={fill} r={DOT_RADIUS} stroke={ink} strokeWidth={outline} />,
      });
    }

    if (look.shape === 'disc') {
      marks.push({
        id: cell.id,
        node: <circle cx={cell.x} cy={cell.y} fill={fill} r={DISC_RADIUS} stroke={ink} strokeWidth={outline} />,
      });
    }

    if (look.shape === 'portal') {
      marks.push({
        id: cell.id,
        node: (
          <>
            <circle cx={cell.x} cy={cell.y} fill="var(--lucid-base)" r={PORTAL_OUTER_RADIUS} stroke={fill} strokeWidth={outline} />
            <circle cx={cell.x} cy={cell.y} fill="none" r={PORTAL_INNER_RADIUS} stroke={fill} strokeWidth={3} />
          </>
        ),
      });
    }

    if (look.icon) {
      const spec = ICON_SPEC[look.icon];
      const isEdge = look.shape === 'tile';
      const color = isEdge ? (isInk ? hollow : ink) : WHITE;

      marks.push({
        id: cell.id,
        node: (
          <g
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.6}
            transform={`translate(${cell.x} ${cell.y + spec.dy}) scale(${spec.size * boost})`}
          >
            {ICON_PATHS[look.icon]}
          </g>
        ),
      });
    }

    if (look.label) {
      const isPortal = look.shape === 'portal';

      marks.push({
        id: cell.id,
        node: (
          <text
            className="font-golos"
            dominantBaseline="central"
            fill={isPortal ? fill : ink}
            fontSize={(isPortal ? PORTAL_MARK_SIZE : MARK_SIZE) * boost}
            fontWeight={600}
            textAnchor="middle"
            x={cell.x}
            y={cell.y}
          >
            {look.label}
          </text>
        ),
      });
    }
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
  const finishCell = layout.byId[track.finishId];
  const safeHalfWidth = (SAFE_LABEL.length * textSize * 0.85) / 3;
  const safeY = finishCell ? finishCell.y + TILE_ACROSS / 2 + 4 + textSize * 0.4 : 0;
  const safeSpots = finishCell
    ? [finishCell.x - safeHalfWidth, finishCell.x, finishCell.x + safeHalfWidth].map(x => ({ x, y: safeY }))
    : [];
  const busy = [
    ...layout.cells,
    ...layout.links.map(link => linkMiddle(layout.byId[link.from], layout.byId[link.to])),
    // Ники стоят над своими клетками — подпись обходит и их
    ...Array.from(groups.keys()).flatMap(position => {
      const cell = layout.byId[position];

      return cell ? [{ x: cell.x, y: cell.y - LABEL_GAP }] : [];
    }),
    ...zoneStarts(track).flatMap(start => {
      const cell = layout.byId[start.cellId];

      if (!cell) {
        return [];
      }

      const halfWidth = (ZONE_LABEL[start.zone].length * textSize * 0.85) / 3;
      const y = cell.y + TILE_ACROSS / 2 + 4 + textSize * 0.4;

      return [cell.x - halfWidth, cell.x, cell.x + halfWidth].map(x => ({ x, y }));
    }),
    ...safeSpots,
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

  useEffect(() => {
    if (hintCellId === undefined) {
      return undefined;
    }

    const timer = window.setTimeout(() => setHintCellId(undefined), HINT_MS);
    const handleOutside = (event: PointerEvent): void => {
      if (!hintRef.current?.contains(event.target as Node)) {
        setHintCellId(undefined);
      }
    };

    document.addEventListener('pointerdown', handleOutside);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', handleOutside);
    };
  }, [hintCellId]);

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

  const handleTapCell = (cellId: number): void => {
    if ((state.G.cellHistory[cellId]?.length ?? 0) > 0) {
      onViewCell?.(cellId);

      return;
    }

    setHintCellId(cellId);
  };

  const hintCell = hintCellId === undefined ? undefined : track.cells.find(cell => cell.id === hintCellId);

  return (
    <div className="relative size-full" ref={containerRef}>
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
                  strokeWidth={tile.width}
                />
              ))}

              <g pointerEvents="none">
                {marks.map((mark, index) => (
                  <g key={`${mark.id}-${index}`}>{mark.node}</g>
                ))}
              </g>

              {finishCell && (
                <text
                  className="font-golos"
                  dominantBaseline="hanging"
                  fill="var(--lucid-text)"
                  fontSize={textSize * 0.85}
                  paintOrder="stroke"
                  pointerEvents="none"
                  stroke="var(--lucid-base)"
                  strokeWidth={4}
                  textAnchor="middle"
                  x={finishCell.x}
                  y={finishCell.y + TILE_ACROSS / 2 + 4}
                >
                  {SAFE_LABEL}
                </text>
              )}

              {zoneStarts(track).map(start => {
                const cell = layout.byId[start.cellId];

                return cell
                  ? (
                      <text
                        className="font-golos"
                        dominantBaseline="hanging"
                        fill="var(--lucid-text)"
                        fontSize={textSize * 0.85}
                        key={`zone-${start.zone}`}
                        paintOrder="stroke"
                        pointerEvents="none"
                        stroke="var(--lucid-base)"
                        strokeWidth={4}
                        textAnchor="middle"
                        x={cell.x}
                        y={cell.y + TILE_ACROSS / 2 + 4}
                      >
                        {ZONE_LABEL[start.zone]}
                      </text>
                    )
                  : null;
              })}

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

              {layout.cells.filter(cell => !onSelectCell || !state.G.branchChoices.includes(cell.id)).map(cell => (
                <g
                  aria-label="Посмотреть клетку"
                  className="cursor-pointer"
                  key={`view-${cell.id}`}
                  onClick={() => handleTapCell(cell.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleTapCell(cell.id);
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
                const tokenTransition = isReducedMotion ? undefined : `cx ${TOKEN_TRANSITION_MS}ms linear, cy ${TOKEN_TRANSITION_MS}ms linear`;

                return (
                  <g key={playerId}>
                    <circle
                      cx={x}
                      cy={y}
                      fill="var(--lucid-text)"
                      r={TOKEN_RADIUS}
                      stroke="var(--lucid-base)"
                      strokeWidth={3}
                      style={{ transition: tokenTransition }}
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
                            style={{ transition: tokenTransition }}
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

      {hintCell && (
        <p
          className="absolute inset-x-2 bottom-2 z-10 rounded-md border-2 px-3 py-2 text-sm leading-snug"
          ref={hintRef}
          role="status"
          style={{ backgroundColor: 'var(--lucid-veil)', borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
        >
          {cellHint(hintCell, state.G)}
        </p>
      )}
    </div>
  );
});
