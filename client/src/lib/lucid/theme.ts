import type { CSSProperties } from 'react';

import type { TThemeRoles } from '@/lib/lucid/colors';

import { parseHex } from '@/lib/lucid/colors';

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

export const themeStyle = (roles: TThemeRoles, worldName: string): CSSProperties => {
  const hash = hashString(worldName);
  // Угол, шаг и плотность выводятся из названия мира: один код, разный
  // результат для каждой партии
  const angle = hash % 180;
  const step = 48 + (hash >> 8) % 96;
  const density = 0.03 + ((hash >> 16) % 5) / 100;

  const weave = roles.supports[0] ?? roles.accent;
  const cross = roles.supports[1] ?? roles.supports[0] ?? roles.accent;
  const lines = [
    `repeating-linear-gradient(${angle}deg, ${withAlpha(weave, density)} 0 1px,`
    + ` transparent 1px ${step}px)`,
    `repeating-linear-gradient(${angle + 90}deg, ${withAlpha(cross, density)} 0 1px,`
    + ` transparent 1px ${step}px)`,
    `radial-gradient(120% 90% at 50% 0%, ${withAlpha(weave, density * 2)} 0%, transparent 70%)`,
  ];

  const variables = {
    '--lucid-base': roles.base,
    '--lucid-text': roles.text,
    '--lucid-accent': roles.accent,
    // Линия трека: опора, если она есть, иначе цвет текста вполсилы
    '--lucid-line': roles.supports[0] ?? withAlpha(roles.text, 0.6),
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
