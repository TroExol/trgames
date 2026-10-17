import type { CSSProperties } from 'react';
import type { LucidShared } from '@trgames/shared';

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

import type { TThemeRoles } from '@/lib/lucid/colors';

import { THEME_ICON_COMPONENTS } from '@/lib/lucid/themeIcons';
import {
  contrastRatio,
  ensureContrast,
  parseHex,
  toHex,
} from '@/lib/lucid/colors';

// FNV-1a: нужен устойчивый номер из названия мира, чтобы фон одной партии
// не менялся между перерисовками и совпадал у всех игроков
export const hashString = (value: string): number => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash;
};

const withAlpha = (hex: string, alpha: number): string => {
  const rgb = parseHex(hex);

  if (!rgb) {
    return `rgba(128, 128, 128, ${alpha})`;
  }

  const channel = (value: number): number => Math.round(value * 255);

  return `rgba(${channel(rgb.r)}, ${channel(rgb.g)}, ${channel(rgb.b)}, ${alpha})`;
};

// Линия трека — это и есть поле, а поле обязано читаться. Опоры контрастом с
// основой не связаны, и бледная опора на бледной основе стирает трек целиком.
// Берётся самая различимая опора и дотягивается до порога сдвигом светлоты:
// взять вместо неё акцент было бы короче, но тогда линия и то, что можно
// нажать, красятся одинаково — и метка хода с кольцами развилки пропадают
const lineColor = (roles: TThemeRoles): string => {
  const base = parseHex(roles.base);

  if (!base) {
    return roles.accent;
  }

  const contrast = (hex: string): number => {
    const rgb = parseHex(hex);

    return rgb ? contrastRatio(rgb, base) : 0;
  };
  const best = roles.supports.reduce(
    (winner, hex) => (contrast(hex) > contrast(winner) ? hex : winner),
    roles.supports[0] ?? roles.accent,
  );
  const rgb = parseHex(best);

  return rgb ? toHex(ensureContrast(rgb, base, 3)) : roles.accent;
};

// mulberry32: тот же сид даёт ту же последовательность у всех игроков
const seededRandom = (seed: number) => (): number => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);

  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const TILE = 240;
const GRID = 3;
const GAP = 4;
const ICON_SIZE = 24;
const ICON_OPACITY = 0.1;

const iconBodies = new Map<LucidShared.TThemeIcon, string>();

// Геометрию берём у самого компонента lucide, а не храним копии путей
const iconBody = (icon: LucidShared.TThemeIcon): string => {
  let body = iconBodies.get(icon);

  if (body === undefined) {
    body = renderToStaticMarkup(createElement(THEME_ICON_COMPONENTS[icon]))
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>$/, '');
    iconBodies.set(icon, body);
  }

  return body;
};

const motifCache = new Map<string, string>();

const motifLayer = (icons: LucidShared.TThemeIcon[], worldName: string, color: string): string => {
  const key = `${icons.join(',')}|${worldName}|${color}`;
  const cached = motifCache.get(key);

  if (cached) {
    return cached;
  }

  const random = seededRandom(hashString(worldName));
  const cell = TILE / GRID;
  let marks = '';

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      if (random() < 0.2) {
        continue;
      }

      const icon = icons[Math.floor(random() * icons.length)];
      const scale = (ICON_SIZE + random() * 18) / ICON_SIZE;
      const span = ICON_SIZE * scale;
      const x = col * cell + GAP + random() * (cell - GAP * 2 - span);
      const y = row * cell + GAP + random() * (cell - GAP * 2 - span);
      const angle = (random() - 0.5) * 60;
      const center = (ICON_SIZE / 2) * scale;

      marks += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})`
        + ` rotate(${angle.toFixed(1)} ${center.toFixed(1)} ${center.toFixed(1)})`
        + ` scale(${scale.toFixed(3)})">${iconBody(icon)}</g>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" fill="none"`
    + ` stroke="${color}" stroke-opacity="${ICON_OPACITY}" stroke-width="1.7"`
    + ` stroke-linecap="round" stroke-linejoin="round">${marks}</svg>`;
  const layer = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / ${TILE}px ${TILE}px repeat`;

  motifCache.set(key, layer);

  return layer;
};

export const themeStyle = (
  roles: TThemeRoles,
  worldName: string,
  icons?: LucidShared.TThemeIcon[],
): CSSProperties => {
  const hash = hashString(worldName);
  // Угол, шаг и плотность выводятся из названия мира: один код, разный
  // результат для каждой партии
  const angle = hash % 180;
  const step = 48 + (hash >> 8) % 96;
  const density = 0.03 + ((hash >> 16) % 5) / 100;

  const weave = roles.supports[0] ?? roles.accent;
  const cross = roles.supports[1] ?? roles.supports[0] ?? roles.accent;
  const glow = `radial-gradient(120% 90% at 50% 0%, ${withAlpha(weave, density * 2)} 0%, transparent 70%)`;
  // Партии без значков (сгенерированные раньше) остаются на сетке линий
  const lines = icons && icons.length > 0
    ? [motifLayer(icons, worldName, roles.text), glow]
    : [
        `repeating-linear-gradient(${angle}deg, ${withAlpha(weave, density)} 0 1px,`
      + ` transparent 1px ${step}px)`,
        `repeating-linear-gradient(${angle + 90}deg, ${withAlpha(cross, density)} 0 1px,`
      + ` transparent 1px ${step}px)`,
        glow,
      ];

  const variables = {
    '--lucid-base': roles.base,
    '--lucid-text': roles.text,
    '--lucid-accent': roles.accent,
    '--lucid-line': lineColor(roles),
    '--lucid-muted': withAlpha(roles.text, 0.62),
    '--lucid-veil': withAlpha(roles.base, 0.88),
  };

  return {
    ...variables,
    color: roles.text,
    backgroundColor: roles.base,
    backgroundImage: lines.join(', '),
  } as CSSProperties;
};
