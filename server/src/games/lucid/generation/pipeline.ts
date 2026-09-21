import type { LucidShared } from '@trgames/shared';

import type { TGenerateJsonResult, TUsage } from '@/games/lucid/generation/deepseek';

import { eventBatchSchema, worldSchema } from '@/games/lucid/generation/schema';
import { buildEventsPrompt, buildWorldPrompt } from '@/games/lucid/generation/prompt';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';

export type TGenerateJson = (prompt: string) => Promise<TGenerateJsonResult>;

// Второй предохранитель к бюджету времени: если модель отвечает быстро и всегда
// невалидно, цикл по времени крутился бы вхолостую. В тестах время к тому же заморожено
export const MAX_ATTEMPTS = 3;

interface TGenerateContentParams {
  generateJson: TGenerateJson;
  theme: string;
  nicknames: string[];
  // Номера реальных клеток событий: ответ модели сверяется с ними
  eventCellIds: number[];
  deadlineMs: number;
}

export interface TGenerateContentResult {
  content: LucidShared.TPartyContent;
  usage: TUsage;
  usedFallback: boolean;
}

export const generateContent = async ({
  generateJson,
  theme,
  nicknames,
  eventCellIds,
  deadlineMs,
}: TGenerateContentParams): Promise<TGenerateContentResult> => {
  let usage: TUsage = { inputTokens: 0, outputTokens: 0 };

  // Разбор возвращает null, если ответ не годится. Тогда запрос повторяется
  const request = async <T>(
    prompt: string,
    parse: (data: unknown) => T | null,
  ): Promise<T | null> => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS && Date.now() < deadlineMs; attempt++) {
      const result = await generateJson(prompt);

      usage = {
        inputTokens: usage.inputTokens + result.usage.inputTokens,
        outputTokens: usage.outputTokens + result.usage.outputTokens,
      };

      const parsed = parse(result.data);

      if (parsed) {
        return parsed;
      }
    }

    return null;
  };

  const parseEvents = (data: unknown): LucidShared.TEvent[] | null => {
    const parsed = eventBatchSchema.safeParse(data);

    if (!parsed.success) {
      return null;
    }

    // Схема не знает трека, поэтому номера клеток сверяются здесь.
    // Если не осталось ни одного настоящего — ответ бесполезен, повторяем
    const known = new Set(eventCellIds);
    const events = parsed.data.events.filter(event => known.has(event.cellId));

    return events.length > 0 ? events : null;
  };

  const withFallback = (): TGenerateContentResult => ({
    content: loadFallbackContent(),
    usage,
    usedFallback: true,
  });

  try {
    const world = await request(buildWorldPrompt(theme, nicknames), data => {
      const parsed = worldSchema.safeParse(data);

      return parsed.success ? parsed.data : null;
    });

    if (!world) {
      return withFallback();
    }

    const events = await request(
      buildEventsPrompt(world.theme.name, world.theme.resourceName, eventCellIds),
      parseEvents,
    );

    if (!events) {
      return withFallback();
    }

    return {
      content: {
        theme: world.theme,
        events: events.reduce<Record<number, LucidShared.TEvent>>(
          (acc, event) => ({ ...acc, [event.cellId]: event }),
          {},
        ),
      },
      usage,
      usedFallback: false,
    };
  } catch {
    // Модель недоступна — вечер не должен на этом заканчиваться
    return withFallback();
  }
};
