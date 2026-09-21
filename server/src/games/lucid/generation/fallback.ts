import type { LucidShared } from '@trgames/shared';

import fallback from './fallback.json';

export const loadFallbackContent = (): LucidShared.TPartyContent => ({
  theme: fallback.theme as LucidShared.TTheme,
  events: (fallback.events as LucidShared.TEvent[]).reduce<Record<number, LucidShared.TEvent>>(
    (acc, event) => ({ ...acc, [event.cellId]: event }),
    {},
  ),
});
