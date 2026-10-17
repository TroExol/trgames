import { LucidShared } from '@trgames/shared';

const KEYS = 'FIRST|LAST|CHOSEN|SELF|ALL|MOVE|RESOURCE|SKIP_TURN|SWAP_WITH_FIRST';
const KEY = `(?<![A-Za-z0-9_])(?:${KEYS})(?![A-Za-z0-9_])`;
const BRACKETED_KEYS = new RegExp(`\\s*[(\\[]\\s*${KEY}(?:\\s*[,/]\\s*${KEY})*\\s*[)\\]]`, 'g');
const BARE_KEY = new RegExp(`\\s*${KEY}`, 'g');
const EMPTY_BRACKETS = /\s*(?:\(\s*\)|\[\s*\])/g;

export const stripSchemaKeys = (text: string): string => {
  const cleaned = text
    .replace(BRACKETED_KEYS, '')
    .replace(BARE_KEY, '')
    .replace(EMPTY_BRACKETS, '')
    .replace(/\s+([,.;:!?…])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || text;
};

const sanitizeEffect = (effect: LucidShared.TEffect): LucidShared.TEffect => (
  effect.text === undefined ? effect : { ...effect, text: stripSchemaKeys(effect.text) }
);

export const sanitizeEvent = (event: LucidShared.TEvent): LucidShared.TEvent => ({
  ...event,
  title: stripSchemaKeys(event.title),
  text: stripSchemaKeys(event.text),
  options: event.options.map(option => ({
    ...option,
    text: stripSchemaKeys(option.text),
    success: sanitizeEffect(option.success),
    ...(option.failure && { failure: sanitizeEffect(option.failure) }),
  })),
});

export const sanitizeTheme = <T extends { name: string; regions: { name: string }[]; icons?: string[] }>(
  { icons, ...theme }: T,
): { icons?: LucidShared.TThemeIcon[] } & Omit<T, 'icons'> => {
  const known = [...new Set(icons)].filter(LucidShared.isThemeIcon);

  return {
    ...theme,
    name: stripSchemaKeys(theme.name),
    regions: theme.regions.map(region => ({ ...region, name: stripSchemaKeys(region.name) })),
    ...(known.length > 0 && { icons: known }),
  };
};
