import type { z } from 'zod';
import type { LucidShared } from '@trgames/shared';

import type { cardNameSchema } from '@/games/lucid/generation/schema';

import { stripSchemaKeys } from '@/games/lucid/generation/sanitize';
import { PROMPT_CARD_IDS } from '@/games/lucid/generation/prompt';

const toCardId = (key: string): string | undefined => {
  const match = /^card(\d+)$/.exec(key);

  return match ? PROMPT_CARD_IDS[Number(match[1]) - 1] : undefined;
};

export const toCardNames = (
  cards: (z.infer<typeof cardNameSchema> | undefined)[] = [],
): Record<string, LucidShared.TCardName> => Object.fromEntries(
  cards.flatMap(card => {
    const id = card ? toCardId(card.id) : undefined;

    return card && id
      ? [[id, { name: stripSchemaKeys(card.name), flavor: stripSchemaKeys(card.flavor) }]]
      : [];
  }),
);
