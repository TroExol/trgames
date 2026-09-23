import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import type { TGenerateJson } from '@/games/lucid/generation/pipeline';

import {
  EVENTS_CHUNK_SIZE,
  generateContent,
  MAX_ATTEMPTS,
} from '@/games/lucid/generation/pipeline';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';

// Прямая цепочка клеток — конкретные depth не важны тестам пайплайна, только
// то, что assignRegionNames/assignPremises не падают на реальной структуре
// трека. Id может быть не связан со стартом/финишем реального трека — depth
// не найденной клетки трактуется раскладкой как 0, крушения не будет
const straightTrackFor = (cellIds: number[]): LucidShared.TTrack => ({
  startId: -1,
  finishId: -2,
  cells: [
    { id: -1, type: LucidShared.ECellType.START, next: cellIds.length > 0 ? [cellIds[0]] : [-2] },
    ...cellIds.map((id, index) => ({
      id,
      type: LucidShared.ECellType.EVENT,
      next: [index + 1 < cellIds.length ? cellIds[index + 1] : -2],
    })),
    { id: -2, type: LucidShared.ECellType.FINISH, next: [] },
  ],
});

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

// Промпт событий перечисляет клетки своего куска строкой на клетку —
// «- клетка 12 — край «...», завязка: ...» — по номерам и отвечаем
const askedCells = (prompt: string): number[] =>
  [...prompt.matchAll(/- клетка (\d+) —/g)].map(match => Number(match[1]));

const run = (
  generateJson: TGenerateJson,
  deadlineOffsetMs = 10_000,
  eventCellIds = [1, 2],
) => generateContent({
  generateJson,
  theme: 'пираты',
  nicknames: ['Аня', 'Боря'],
  eventCellIds,
  track: straightTrackFor(eventCellIds),
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

  it('итог содержит число вызовов и запрошенных событий', async () => {
    const generateJson: TGenerateJson = vi.fn()
      .mockResolvedValueOnce({ data: validWorld, usage })
      .mockResolvedValue({ data: eventsFor([1]), usage });

    const result = await run(generateJson, 10_000, [1]);

    expect(result.stats).toEqual({
      durationMs: 0,
      requestedEvents: 1,
      callsCount: 2,
      retriesCount: 0,
    });
  });

  it('при невалидном ответе повторяет запрос, и это считается перегенерацией', async () => {
    const generateJson: TGenerateJson = vi.fn()
      .mockResolvedValueOnce({ data: { theme: { name: '' } }, usage })
      .mockResolvedValueOnce({ data: validWorld, usage })
      .mockResolvedValue({ data: eventsFor([1]), usage });

    const result = await run(generateJson, 10_000, [1]);

    expect(result.usedFallback).toBe(false);
    expect(generateJson).toHaveBeenCalledTimes(3);
    expect(result.stats).toEqual({
      durationMs: 0,
      requestedEvents: 1,
      callsCount: 3,
      retriesCount: 1,
    });
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

  it('токены вызова, упавшего уже после ответа, всё равно уходят в onCall', async () => {
    // Например, ответ обрезан по лимиту токенов и не распарсился — провайдер
    // всё равно посчитал их и вернул в самой ошибке
    const spent = { inputTokens: 5, outputTokens: 7, costUsd: 0.0003 };
    const onCall = vi.fn();
    const generateJson: TGenerateJson = vi.fn()
      .mockRejectedValue(Object.assign(new Error('невалидный JSON'), { usage: spent }));

    const result = await generateContent({
      generateJson,
      theme: 'пираты',
      nicknames: ['Аня', 'Боря'],
      eventCellIds: [1, 2],
      track: straightTrackFor([1, 2]),
      deadlineMs: Date.now() + 10_000,
      seed: SEED,
      onCall,
    });

    expect(result.usedFallback).toBe(true);
    expect(onCall).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'world',
      outcome: 'error',
      errorMessage: 'невалидный JSON',
      inputTokens: spent.inputTokens,
      outputTokens: spent.outputTokens,
      costUsd: spent.costUsd,
    }));
  });

  it('кусок, долетевший уже после того, как генерация ушла на запасную партию, тоже попадает в onCall', async () => {
    const onCall = vi.fn();
    // Мир и два куска (MANY_CELLS длиннее одного чанка): первый кусок падает
    // сразу, второй специально держим висящим, чтобы имитировать поздний ответ
    let resolveStray: ((value: { data: unknown; usage: typeof usage }) => void) | undefined;
    const generateJson: TGenerateJson = vi.fn()
      .mockResolvedValueOnce({ data: validWorld, usage })
      .mockImplementationOnce(() => Promise.reject(new Error('чанк недоступен')))
      .mockImplementationOnce(() => new Promise(resolve => {
        resolveStray = resolve;
      }));

    const result = await generateContent({
      generateJson,
      theme: 'пираты',
      nicknames: ['Аня'],
      eventCellIds: MANY_CELLS,
      track: straightTrackFor(MANY_CELLS),
      deadlineMs: Date.now() + 10_000,
      seed: SEED,
      onCall,
    });

    // Генерация уже вернула запасную партию — второй кусок ещё не ответил
    expect(result.usedFallback).toBe(true);
    expect(onCall).toHaveBeenCalledWith(expect.objectContaining({ stage: 'events', outcome: 'error' }));
    expect(onCall).not.toHaveBeenCalledWith(expect.objectContaining({ stage: 'events', outcome: 'ok' }));

    // Поздний ответ долетает уже после того, как generateContent вернул результат
    resolveStray!({ data: eventsFor(MANY_CELLS.slice(EVENTS_CHUNK_SIZE)), usage });
    await vi.advanceTimersByTimeAsync(0);

    expect(onCall).toHaveBeenCalledWith(expect.objectContaining({ stage: 'events', outcome: 'ok' }));
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
      track: straightTrackFor([1, 2]),
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
      track: straightTrackFor([1]),
      deadlineMs: Date.now() + 10_000,
      seed: 'stages',
      onWorld,
    });

    expect(onWorld).not.toHaveBeenCalled();
  });
});
