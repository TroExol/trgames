import type { ChatResult } from '@openrouter/sdk/esm/models/chatresult';

import { z } from 'zod';
import { OpenRouter } from '@openrouter/sdk';

export interface TUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface TGenerateJsonResult {
  data: unknown;
  usage: TUsage;
}

// Значение по умолчанию — конкретная модель, а не провайдер: сам провайдер задаётся
// маршрутизацией OpenRouter
const DEFAULT_MODEL = 'deepseek/deepseek-v4.1-flash';

// OpenRouter умеет структурированный вывод по json_schema, но гарантия провайдера —
// только про форму ответа. Допустимые диапазоны значений и существующие номера клеток
// эта схема не знает, поэтому собственная валидация (@/games/lucid/generation/schema)
// остаётся обязательной и здесь не ослабляется
export const generateJson = async (
  prompt: string,
  schema?: z.ZodType,
): Promise<TGenerateJsonResult> => {
  const client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY ?? '' });

  try {
    const response = await client.chat.send({
      chatRequest: {
        model: process.env.LUCID_MODEL ?? DEFAULT_MODEL,
        messages: [{ role: 'user' as const, content: prompt }],
        stream: false,
        responseFormat: schema
          ? {
              type: 'json_schema',
              jsonSchema: {
                name: 'lucid_response',

                schema: z.toJSONSchema(schema),
              },
            }
          : { type: 'json_object' },
        // Запрашиваем структурированный вывод только у провайдеров, которые реально
        // поддерживают этот параметр — иначе запрос ушёл бы туда, где он молча игнорируется
        provider: schema ? { requireParameters: true } : null,
      },
      // Запрос всегда без стрима, поэтому ответ гарантированно ChatResult, а не поток событий.
      // Сама SDK-перегрузка это не выводит из инлайн-литерала — уточняем явно
    }) as ChatResult;

    const content = response.choices[0]?.message.content;

    if (typeof content !== 'string') {
      throw new Error('ответ модели пуст или имеет неожиданный формат');
    }

    return {
      data: JSON.parse(content) as unknown,
      usage: {
        inputTokens: response.usage?.promptTokens ?? 0,
        outputTokens: response.usage?.completionTokens ?? 0,
        costUsd: response.usage?.cost ?? 0,
      },
    };
  } catch (error) {
    throw new Error(
      `OpenRouter не смог сгенерировать ответ: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
