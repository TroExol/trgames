export interface TRgb {
  r: number;
  g: number;
  b: number;
}

export interface TOklch {
  l: number;
  c: number;
  h: number;
}

export type TMood = 'DARK' | 'LIGHT';

export interface TThemeRoles {
  // Плоскость, на которой всё лежит
  base: string;
  // Контраст с основой не ниже 4.5:1 — гарантируется вычислением, а не выбором
  text: string;
  // Им обозначается то, что можно нажать. Контраст не ниже 3:1
  accent: string;
  // Остальные цвета: крупные плоскости, линия трека, текстура. Требований нет
  supports: string[];
  isDark: boolean;
}

const BLACK: TRgb = { r: 0, g: 0, b: 0 };
const WHITE: TRgb = { r: 1, g: 1, b: 1 };
// Палитра может прийти пустой или целиком из мусора — играть всё равно надо
const FALLBACK_PALETTE = ['#101014', '#f2f2f7', '#7c5cff'];

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);

export const parseHex = (value: string): TRgb | null => {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(value.trim());

  if (!match) {
    return null;
  }

  const digits = match[1].length === 3
    ? match[1].split('').map(digit => digit + digit).join('')
    : match[1];

  return {
    r: parseInt(digits.slice(0, 2), 16) / 255,
    g: parseInt(digits.slice(2, 4), 16) / 255,
    b: parseInt(digits.slice(4, 6), 16) / 255,
  };
};

export const toHex = ({ r, g, b }: TRgb): string => {
  const channel = (value: number): string =>
    Math.round(clamp01(value) * 255).toString(16).padStart(2, '0');

  return `#${channel(r)}${channel(g)}${channel(b)}`;
};

const toLinear = (value: number): number =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const fromLinear = (value: number): number =>
  value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

const luminance = ({ r, g, b }: TRgb): number =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

export const contrastRatio = (first: TRgb, second: TRgb): number => {
  const a = luminance(first);
  const b = luminance(second);

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

export const rgbToOklch = (rgb: TRgb): TOklch => {
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const labL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const labA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const labB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    l: labL,
    c: Math.hypot(labA, labB),
    h: (Math.atan2(labB, labA) * 180) / Math.PI,
  };
};

export const oklchToRgb = ({ l, c, h }: TOklch): TRgb => {
  const radians = (h * Math.PI) / 180;
  const labA = c * Math.cos(radians);
  const labB = c * Math.sin(radians);

  const lCube = (l + 0.3963377774 * labA + 0.2158037573 * labB) ** 3;
  const mCube = (l - 0.1055613458 * labA - 0.0638541728 * labB) ** 3;
  const sCube = (l - 0.0894841775 * labA - 1.291485548 * labB) ** 3;

  return {
    r: clamp01(fromLinear(4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube)),
    g: clamp01(fromLinear(-1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube)),
    b: clamp01(fromLinear(-0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube)),
  };
};

// Цвет всё равно уедет в восьмибитный hex, поэтому порог проверяется на уже
// округлённом значении: иначе округление съедает сотые доли контраста и
// отданный цвет оказывается ниже порога, который проверка признала взятым
const quantize = ({ r, g, b }: TRgb): TRgb => ({
  r: Math.round(clamp01(r) * 255) / 255,
  g: Math.round(clamp01(g) * 255) / 255,
  b: Math.round(clamp01(b) * 255) / 255,
});

// Тон и насыщенность сохраняются, двигается только светлота: текст остаётся
// «из этого мира». Если не хватило и этого, берём чёрный или белый — для любой
// основы один из них даёт не меньше 4.58:1, так что порог достижим всегда
export const ensureContrast = (color: TRgb, base: TRgb, target: number): TRgb => {
  const quantized = quantize(color);

  if (contrastRatio(quantized, base) >= target) {
    return quantized;
  }

  const towardsDark = contrastRatio(BLACK, base) > contrastRatio(WHITE, base);
  const source = rgbToOklch(color);

  for (let step = 1; step <= 100; step++) {
    const shifted = quantize(oklchToRgb({
      ...source,
      l: clamp01(towardsDark ? source.l - step / 100 : source.l + step / 100),
    }));

    if (contrastRatio(shifted, base) >= target) {
      return shifted;
    }
  }

  return towardsDark ? BLACK : WHITE;
};

export const deriveRoles = (palette: string[], mood?: TMood): TThemeRoles => {
  const parsed = palette
    .map(value => ({ hex: value, rgb: parseHex(value) }))
    .filter((entry): entry is { hex: string; rgb: TRgb } => entry.rgb !== null);
  const colors = parsed.length > 0
    ? parsed
    : FALLBACK_PALETTE.map(hex => ({ hex, rgb: parseHex(hex)! }));

  const withOklch = colors.map(entry => ({ ...entry, oklch: rgbToOklch(entry.rgb) }));
  const averageLightness = withOklch
    .reduce((sum, entry) => sum + entry.oklch.l, 0) / withOklch.length;
  const isDark = mood ? mood === 'DARK' : averageLightness < 0.5;

  // Крайний по светлоте цвет: самый тёмный для тёмной партии, самый светлый для светлой
  const baseEntry = withOklch.reduce((best, entry) =>
    (isDark ? entry.oklch.l < best.oklch.l : entry.oklch.l > best.oklch.l) ? entry : best);
  const rest = withOklch.filter(entry => entry !== baseEntry);
  const candidates = rest.length > 0 ? rest : withOklch;

  const readable = candidates.filter(entry => contrastRatio(entry.rgb, baseEntry.rgb) >= 4.5);
  const textSource = readable.length > 0
    ? readable.reduce((best, entry) =>
        contrastRatio(entry.rgb, baseEntry.rgb) > contrastRatio(best.rgb, baseEntry.rgb)
          ? entry
          : best)
    : candidates.reduce((best, entry) => (entry.oklch.c < best.oklch.c ? entry : best));

  const visible = candidates.filter(entry => contrastRatio(entry.rgb, baseEntry.rgb) >= 3);
  const accentSource = (visible.length > 0 ? visible : candidates)
    .reduce((best, entry) => (entry.oklch.c > best.oklch.c ? entry : best));

  const text = toHex(ensureContrast(textSource.rgb, baseEntry.rgb, 4.5));
  const accent = toHex(ensureContrast(accentSource.rgb, baseEntry.rgb, 3));
  const supports = candidates
    .filter(entry => entry !== textSource && entry !== accentSource)
    .map(entry => entry.hex);

  return {
    base: baseEntry.hex,
    text,
    accent,
    supports: supports.length > 0 ? supports : [accentSource.hex],
    isDark,
  };
};
