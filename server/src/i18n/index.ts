import { ru as ruPluralizer } from 'make-plural';
import { I18n, useMakePlural } from 'i18n-js';

import type { DeepKeys } from './types';

import { ru } from './translations/ru';

type TLocale = 'ru';

const locales: Record<TLocale, typeof ru> = {
  ru,
};

const defaultLocale: TLocale = 'ru';

export const i18n = new I18n();

i18n.missingTranslation.register('key', (_i18n, scope) => {
  if (typeof scope === 'string') {
    return scope.split('.').join(' ');
  }
  return scope.join('.').split('.').join(' ');
});

i18n.pluralization.register('ru', useMakePlural({ pluralizer: ruPluralizer }));

i18n.store(locales);

i18n.defaultLocale = defaultLocale;
i18n.enableFallback = true;
i18n.locale = defaultLocale;
i18n.missingBehavior = 'key';

export const t = <
  K extends string,
>(
  key: DeepKeys<K, typeof ru>,
  locale: TLocale,
  params?: Record<string, string | number>,
): string => {
  i18n.locale = locale;

  const translation: { one: string } | string = i18n.t(key, params);

  if (typeof translation === 'object' && 'one' in translation) {
    return translation.one;
  }

  return translation;
};
