import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { TGenerateJson } from '@/games/lucid/generation/pipeline';

import {
  EVENTS_CHUNK_SIZE,
  generateContent,
  MAX_ATTEMPTS,
} from '@/games/lucid/generation/pipeline';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';

const usage = { inputTokens: 10, outputTokens: 20, costUsd: 0.001 };

const validWorld = {
  theme: {
    name: 'Пираты',
    resourceName: 'дублоны',
    palette: ['#102030', '#405060', '#708090'],
    regions: [
      { name: 'Бухта висельников', color: '#102030' },
      { name: 'Пальмовый берег', color: '#405060' },
      { name: 'Пороховой трюм', color: '#708090' },
    ],
  },
};

const eventsFor = (cellIds: number[]) => ({
  events: cellIds.map(cellId => ({
    cellId,
    title: 'Мель',
    text: 'Шхуна села на мель',
    options: [{ text: 'Толкать', success: { atoms: [{ kind: 'MOVE', target: 'SELF', value: 1 }] } }],
  })),
});

const SEED = 'pipeline';

// Клеток больше, чем влезает в один кусок: ответ придёт двумя запросами
const MANY_CELLS = Array.from({ length: EVENTS_CHUNK_SIZE + 3 }, (_, index) => index + 1);

// Промпт событий перечисляет номера клеток своего куска — по ним и отвечаем
const askedCells = (prompt: string): number[] =>
  (/каждую: ([\d, ]+)/.exec(prompt)?.[1] ?? '').split(', ').map(Number);

const run = (
  generateJson: TGenerateJson,
  deadlineOffsetMs = 10_000,
  eventCellIds = [1, 2],
) => generateContent({
  generateJson,
  theme: 'пираты',
  nicknames: ['Аня', 'Боря'],
  eventCellIds,
  deadlineMs: Date.now() + deadlineOffsetMs,
  seed: SEED,
});

describe('generateContent', () => {
  it('собирает контент из ответов модели', async () => {
    const generateJson: TGenerateJson = vi.fn()
      .mockResolvedValueOnce({ data: validWorld, usage })
      .mockResolvedValue({ data: eventsFor([1, 2]), usage });

    const result = await run(generateJson);

    expect(result.content.theme.name).toBe('Пираты');
    expect(Object.keys(result.content.events)).toEqual(['1', '2']);
    expect(result.usedFallback).toBe(false);
  });

  it('суммирует расход токенов по всем вызовам', async () => {
    const generateJson: TGenerateJson = vi.fn()
      .mockResolvedValueOnce({ data: validWorld, usage })
      .mockResolvedValue({ data: eventsFor([1]), usage });

    expect((await run(generateJson)).usage).toEqual({ inputTokens: 20, outputTokens: 40, costUsd: 0.002 });
  });

  it('при невалидном ответе повторяет запрос', async () => {
    const generateJson: TGenerateJson = vi.fn()
      .mockResolvedValueOnce({ data: { theme: { name: '' } }, usage })
      .mockResolvedValueOnce({ data: validWorld, usage })
      .mockResolvedValue({ data: eventsFor([1]), usage });

    const result = await run(generateJson);

    expect(result.usedFallback).toBe(false);
    expect(generateJson).toHaveBeenCalledTimes(3);
  });

  it('выбрасывает события для клеток, которых нет в треке', async () => {
    const generateJson: TGenerateJson = vi.fn()
      .mockResolvedValueOnce({ data: validWorld, usage })
      .mockResolvedValue({ data: eventsFor([1, 999]), usage });

    const result = await run(generateJson);

    expect(Object.keys(result.content.events)).toEqual(['1']);
  });

  it('пачка целиком из несуществующих клеток считается невалидной', async () => {
    const generateJson: TGenerateJson = vi.fn()
      .mockResolvedValueOnce({ data: validWorld, usage })
      .mockResolvedValue({ data: eventsFor([777, 999]), usage });

    expect((await run(generateJson)).usedFallback).toBe(true);
  });

  it('всегда невалидные ответы не зацикливают: срабатывает предел попыток', async () => {
    const generateJson: TGenerateJson = vi.fn().mockResolvedValue({ data: { broken: true }, usage });

    // Время заморожено фейковыми таймерами: завершить цикл может только предел попыток
    const result = await run(generateJson, 60_000);

    expect(result.usedFallback).toBe(true);
    expect(generateJson).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it('по истечении бюджета времени отдаёт запасную партию, не обращаясь к модели', async () => {
    const generateJson: TGenerateJson = vi.fn().mockResolvedValue({ data: validWorld, usage });

    const result = await run(generateJson, -1);

    expect(result.usedFallback).toBe(true);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it('события всех клеток собираются из нескольких кусков', async () => {
    const generateJson: TGenerateJson = vi.fn()
      .mockResolvedValueOnce({ data: validWorld, usage })
      .mockImplementation((prompt: string) =>
        Promise.resolve({ data: eventsFor(askedCells(prompt)), usage }));

    const result = await run(generateJson, 10_000, MANY_CELLS);

    expect(Object.keys(result.content.events).map(Number)).toEqual(MANY_CELLS);
    expect(result.usedFallback).toBe(false);
    // Мир и два куска: одним запросом столько событий не просится
    expect(generateJson).toHaveBeenCalledTimes(3);
  });

  it('неудавшийся кусок уводит на запасную партию целиком', async () => {
    const lastCell = MANY_CELLS[MANY_CELLS.length - 1];
    const generateJson: TGenerateJson = vi.fn()
      .mockResolvedValueOnce({ data: validWorld, usage })
      .mockImplementation((prompt: string) => Promise.resolve({
        // Последний кусок не даётся ни с какой попытки. Смешивать его события
        // с запасными нельзя: мир должен остаться цельным
        data: askedCells(prompt).includes(lastCell) ? { broken: true } : eventsFor(askedCells(prompt)),
        usage,
      }));

    expect((await run(generateJson, 10_000, MANY_CELLS)).usedFallback).toBe(true);
  });

  it('истёкший бюджет обрывает уже летящий запрос', async () => {
    // Модель не отвечает никогда: прекратить ожидание может только сигнал
    const generateJson: TGenerateJson = (prompt, schema, signal) => new Promise((_resolve, reject) => {
      signal?.addEventListener('abort', () => reject(new Error('запрос прерван')));
    });

    const generated = run(generateJson, 5_000);

    await vi.advanceTimersByTimeAsync(5_000);

    expect((await generated).usedFallback).toBe(true);
  });

  it('при падении модели отдаёт запасную партию', async () => {
    const generateJson: TGenerateJson = vi.fn().mockRejectedValue(new Error('сеть недоступна'));

    const result = await run(generateJson);

    expect(result.usedFallback).toBe(true);
    expect(result.content.theme.name).toBe(loadFallbackContent([1, 2], SEED).theme.name);
  });

  it('токены не теряются, если ответ пришёл, но упал уже после него', async () => {
    // Например, ответ обрезан по лимиту токенов и не распарсился — провайдер
    // всё равно посчитал их и вернул в самой ошибке
    const spent = { inputTokens: 5, outputTokens: 7, costUsd: 0.0003 };
    const generateJson: TGenerateJson = vi.fn()
      .mockRejectedValue(Object.assign(new Error('невалидный JSON'), { usage: spent }));

    const result = await run(generateJson);

    expect(result.usedFallback).toBe(true);
    expect(result.usage).toEqual(spent);
  });

  it('сообщает о готовности мира до того, как готовы события', async () => {
    const seen: string[] = [];
    const generateJson: TGenerateJson = vi.fn()
      .mockImplementationOnce(() => {
        seen.push('запрос мира');

        return Promise.resolve({ data: validWorld, usage });
      })
      .mockImplementation(() => {
        seen.push('запрос событий');

        return Promise.resolve({ data: eventsFor([1, 2]), usage });
      });

    await generateContent({
      generateJson,
      theme: 'пираты',
      nicknames: ['Аня'],
      eventCellIds: [1, 2],
      deadlineMs: Date.now() + 10_000,
      seed: 'stages',
      onWorld: theme => seen.push(`мир готов: ${theme.name}`),
    });

    expect(seen).toEqual(['запрос мира', 'мир готов: Пираты', 'запрос событий']);
  });

  it('о готовности мира не сообщает, если играем на запасной партии', async () => {
    const onWorld = vi.fn();
    const generateJson: TGenerateJson = vi.fn().mockRejectedValue(new Error('сеть недоступна'));

    await generateContent({
      generateJson,
      theme: 'пираты',
      nicknames: ['Аня'],
      eventCellIds: [1],
      deadlineMs: Date.now() + 10_000,
      seed: 'stages',
      onWorld,
    });

    expect(onWorld).not.toHaveBeenCalled();
  });
});
