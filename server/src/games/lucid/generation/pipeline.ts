import type { z } from 'zod';
import type { LucidShared } from '@trgames/shared';

import { chunk } from 'lodash';

import type { TGenerateJsonResult, TUsage } from '@/games/lucid/generation/model';

import { eventBatchSchema, worldSchema } from '@/games/lucid/generation/schema';
import { buildEventsPrompt, buildWorldPrompt } from '@/games/lucid/generation/prompt';
import { MODEL_ID } from '@/games/lucid/generation/model';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';

export type TGenerateJson = (
  prompt: string,
  schema?: z.ZodType,
  signal?: AbortSignal,
) => Promise<TGenerateJsonResult>;

// Второй предохранитель к бюджету времени: если модель отвечает быстро и всегда
// невалидно, цикл по времени крутился бы вхолостую. В тестах время к тому же заморожено
export const MAX_ATTEMPTS = 3;

// Сколько событий просим за один запрос. Одним запросом на все клетки модель
// отвечает минутами: выход растёт вместе с числом событий, а пишет она его
// подряд. Куски идут параллельно, поэтому ожидание — это самый долгий кусок,
// а не их сумма. Шесть — из замера: кусок по дюжине событий приходил
// за 25-270 секунд, кусок по шесть — за 12-60, когда запрос попадал
// на быстрый эндпоинт
export const EVENTS_CHUNK_SIZE = 6;

export type TCallStage = 'events' | 'world';
export type TCallOutcome = 'error' | 'invalid' | 'ok';

// Один вызов модели. Пишется в хранилище сразу же, как только вызов завершился
// (см. onCall ниже) — независимо от того, чем в итоге закончилась вся генерация
export interface TGenerationCallInfo {
  stage: TCallStage;
  model: string;
  // Номер попытки внутри своего запроса (мира или одного куска событий), с 1
  attempt: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  outcome: TCallOutcome;
  errorMessage?: string;
}

interface TGenerateContentParams {
  generateJson: TGenerateJson;
  theme: string;
  nicknames: string[];
  // Номера реальных клеток событий: ответ модели сверяется с ними
  eventCellIds: number[];
  deadlineMs: number;
  seed: string;
  // Вызывается, как только готова стадия «Мир»: тема перекрашивает экран,
  // пока события ещё генерируются
  onWorld?: (theme: LucidShared.TTheme) => void;
  // Зовётся сразу после каждого вызова модели, успешного или нет — в том числе
  // для куска, который долетел уже после того, как вся генерация ушла на
  // запасную партию. Собственно запись в хранилище — забота вызывающего кода
  onCall?: (call: TGenerationCallInfo) => void;
}

export interface TGenerateStats {
  durationMs: number;
  requestedEvents: number;
  // Сколько вызовов модели сделано всего
  callsCount: number;
  // Вызовы сверх одного на запрос (мир и каждый кусок событий — свой запрос)
  retriesCount: number;
}

export interface TGenerateContentResult {
  content: LucidShared.TPartyContent;
  usedFallback: boolean;
  stats: TGenerateStats;
}

export const generateContent = async ({
  generateJson,
  theme,
  nicknames,
  eventCellIds,
  deadlineMs,
  seed,
  onWorld,
  onCall,
}: TGenerateContentParams): Promise<TGenerateContentResult> => {
  const startedAt = Date.now();
  let callsCount = 0;
  let retriesCount = 0;

  // Проверкой перед попыткой бюджет не удержать: уже летящий запрос ею не
  // оборвать, и ждать его можно сколько угодно. Сигнал обрывает и его,
  // и все параллельные куски разом
  const budget = new AbortController();
  const budgetTimer = setTimeout(() => budget.abort(), Math.max(deadlineMs - Date.now(), 0));

  const stats = (): TGenerateStats => ({
    durationMs: Date.now() - startedAt,
    requestedEvents: eventCellIds.length,
    callsCount,
    retriesCount,
  });

  // Разбор возвращает null, если ответ не годится. Тогда запрос повторяется
  const request = async <T>(
    stage: TCallStage,
    prompt: string,
    schema: z.ZodType,
    parse: (data: unknown) => T | null,
  ): Promise<T | null> => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS && Date.now() < deadlineMs; attempt++) {
      const calledAt = Date.now();

      try {
        const result = await generateJson(prompt, schema, budget.signal);
        const parsed = parse(result.data);

        callsCount++;
        if (attempt > 0) {
          retriesCount++;
        }

        onCall?.({
          stage,
          model: MODEL_ID,
          attempt: attempt + 1,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          costUsd: result.usage.costUsd,
          durationMs: Date.now() - calledAt,
          outcome: parsed ? 'ok' : 'invalid',
        });

        if (parsed) {
          return parsed;
        }
      } catch (error) {
        // Ответ мог прийти и быть учтён провайдером, даже если сам вызов
        // упал (например, обрезан по лимиту токенов) — учитываем его в строке
        // вызова и только потом прерываем генерацию тем же способом, что и раньше
        const spent = error instanceof Error ? (error as { usage?: TUsage } & Error).usage : undefined;

        callsCount++;
        if (attempt > 0) {
          retriesCount++;
        }

        onCall?.({
          stage,
          model: MODEL_ID,
          attempt: attempt + 1,
          inputTokens: spent?.inputTokens ?? 0,
          outputTokens: spent?.outputTokens ?? 0,
          costUsd: spent?.costUsd ?? 0,
          durationMs: Date.now() - calledAt,
          outcome: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    }

    return null;
  };

  // Схема не знает трека, поэтому номера клеток сверяются здесь, и каждый
  // кусок — со своими. Если не осталось ни одного настоящего — ответ
  // бесполезен, повторяем
  const parseEvents = (chunkIds: number[]) => (data: unknown): LucidShared.TEvent[] | null => {
    const parsed = eventBatchSchema.safeParse(data);

    if (!parsed.success) {
      return null;
    }

    const known = new Set(chunkIds);
    const taken = new Set<number>();
    // Повтор номера клетки отбрасывается, а не перезаписывает предыдущее событие:
    // иначе одна клетка получила бы два события, другая осталась бы пустой,
    // и ответ всё равно считался бы успешным
    const events = parsed.data.events.filter(event => {
      if (!known.has(event.cellId) || taken.has(event.cellId)) {
        return false;
      }

      taken.add(event.cellId);

      return true;
    });

    return events.length > 0 ? events : null;
  };

  const withFallback = (): TGenerateContentResult => ({
    content: loadFallbackContent(eventCellIds, seed),
    usedFallback: true,
    stats: stats(),
  });

  try {
    const world = await request('world', buildWorldPrompt(theme, nicknames), worldSchema, data => {
      const parsed = worldSchema.safeParse(data);

      return parsed.success ? parsed.data : null;
    });

    if (!world) {
      return withFallback();
    }

    onWorld?.(world.theme);

    // У каждого куска своя валидация и свои попытки, но идут они разом
    const batches = await Promise.all(chunk(eventCellIds, EVENTS_CHUNK_SIZE).map(chunkIds => request(
      'events',
      buildEventsPrompt(world.theme.name, world.theme.resourceName, chunkIds, world.roles ?? []),
      eventBatchSchema,
      parseEvents(chunkIds),
    )));

    // Не дался хотя бы один кусок — на запасную партию уходит вся: события
    // двух разных миров смешивать нельзя, мир должен остаться цельным
    if (batches.some(batch => !batch)) {
      return withFallback();
    }

    return {
      content: {
        theme: world.theme,
        // Куски не пересекаются по клеткам: каждый сверился со своими номерами
        events: batches.flatMap(batch => batch ?? []).reduce<Record<number, LucidShared.TEvent>>(
          (acc, event) => ({ ...acc, [event.cellId]: event }),
          {},
        ),
        // Сопоставление с конкретными игроками — забота setupParty, здесь только сырой ответ модели
        roles: world.roles,
      },
      usedFallback: false,
      stats: stats(),
    };
  } catch {
    // Модель недоступна или бюджет вышел — вечер не должен на этом заканчиваться
    return withFallback();
  } finally {
    clearTimeout(budgetTimer);
  }
};
