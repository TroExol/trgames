import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import type { TPartySnapshot } from '@/games/lucid/room/Party';

import { createStorage } from '@/games/lucid/storage/db';
import { createPartyGroup } from '@/games/lucid/room/PartyGroup';
import { createHandlers, createParty } from '@/games/lucid/init';
import { generateContent } from '@/games/lucid/generation/pipeline';

// Настоящий пайплайн стучится в сеть. Подменяем его целиком, чтобы вызвать
// отказ generate без реального похода в OpenRouter
vi.mock('@/games/lucid/generation/pipeline', () => ({ generateContent: vi.fn() }));

const setup = () => {
  const storage = createStorage<TPartySnapshot>(':memory:');
  const group = createPartyGroup({ storage });
  const party = group.create({ uuid: 'p1', ownerId: 'a' });
  party.join({ playerId: 'a', nickname: 'Аня' });
  party.join({ playerId: 'b', nickname: 'Боря' });

  const broadcast = vi.fn();
  const fail = vi.fn();
  const sync = vi.fn();
  const handlers = createHandlers({
    group,
    storage,
    broadcast,
    fail,
    sync,
  });

  return {
    group,
    storage,
    party,
    broadcast,
    fail,
    sync,
    handlers,
  };
};

const emptyContent = (): LucidShared.TPartyContent => ({
  theme: { name: 'Мир', resourceName: 'ресурс', palette: ['#111111'] },
  events: {},
});

describe('обработчики', () => {
  it('предложенная тема расходится всем', () => {
    const { handlers, party, broadcast } = setup();

    handlers[LucidShared.ELucidEvent.proposeTheme]({ party, playerId: 'a' }, 'пираты');

    expect(party.view('b').members[0].themeProposal).toBe('пираты');
    expect(broadcast).toHaveBeenCalledWith(party);
  });

  it('пустая тема оборачивается понятной ошибкой', () => {
    const { handlers, party, fail, broadcast } = setup();

    handlers[LucidShared.ELucidEvent.proposeTheme]({ party, playerId: 'a' }, '  ');

    expect(fail).toHaveBeenCalledWith(party, 'a', 'Тема не может быть пустой');
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('запустить партию может только владелец', () => {
    const { handlers, party, fail } = setup();

    handlers[LucidShared.ELucidEvent.startParty]({ party, playerId: 'b' });

    expect(fail).toHaveBeenCalledWith(party, 'b', 'Начать партию пока нельзя');
  });

  it('отказ generate откатывает партию в лобби и не роняет процесс необработанным отказом', async () => {
    const { handlers, party } = setup();
    vi.mocked(generateContent).mockRejectedValueOnce(new Error('модель недоступна'));

    handlers[LucidShared.ELucidEvent.startParty]({ party, playerId: 'a' });

    // Цепочка старта запущена без await (fire-and-forget), поэтому ждём её
    // ручным прогоном микрозадач: если бы .catch отсутствовал, отказ ушёл бы
    // необработанным, и до этой точки процесс vitest бы не дошёл живым
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }

    expect(party.view('a').phase).toBe(LucidShared.EPartyPhase.LOBBY);
    expect(party.canStart).toBe(true);
    expect(party.takeRibbonDelta()).toContain('Не получилось собрать партию — запустите ещё раз');
  });

  it('удачная генерация пишет строку вызова и итоговую строку в хранилище', async () => {
    const { handlers, party, storage } = setup();

    vi.mocked(generateContent).mockImplementationOnce(({ onCall }) => {
      onCall?.({
        stage: 'world',
        model: 'test/model',
        attempt: 1,
        inputTokens: 10,
        outputTokens: 20,
        costUsd: 0.01,
        durationMs: 500,
        outcome: 'ok',
      });

      return Promise.resolve({
        content: emptyContent(),
        usedFallback: false,
        stats: {
          durationMs: 1_000,
          requestedEvents: 0,
          callsCount: 1,
          retriesCount: 0,
        },
      });
    });

    handlers[LucidShared.ELucidEvent.startParty]({ party, playerId: 'a' });

    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }

    const report = storage.usageReport();

    expect(report.totals).toEqual(expect.objectContaining({ generations: 1, calls: 1, costUsd: 0.01 }));
    expect(report.recent[0]).toEqual(expect.objectContaining({ usedFallback: false }));
  });

  it('генерация на запасной партии тоже пишет итоговую строку', async () => {
    const { handlers, party, storage } = setup();

    vi.mocked(generateContent).mockResolvedValueOnce({
      content: emptyContent(),
      usedFallback: true,
      stats: {
        durationMs: 2_000,
        requestedEvents: 3,
        callsCount: 4,
        retriesCount: 1,
      },
    });

    handlers[LucidShared.ELucidEvent.startParty]({ party, playerId: 'a' });

    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }

    const report = storage.usageReport();

    expect(report.totals).toEqual(expect.objectContaining({ generations: 1, fallbackShare: 1, retries: 1 }));
    expect(report.recent[0]).toEqual(expect.objectContaining({ usedFallback: true, retriesCount: 1 }));
  });

  it('сбой записи итоговой строки не откатывает партию и не уводит её на запасной контент', async () => {
    const { handlers, party, storage } = setup();

    vi.spyOn(storage, 'saveGeneration').mockImplementation(() => {
      throw new Error('диск недоступен');
    });
    vi.mocked(generateContent).mockResolvedValueOnce({
      content: emptyContent(),
      usedFallback: false,
      stats: {
        durationMs: 500,
        requestedEvents: 1,
        callsCount: 1,
        retriesCount: 0,
      },
    });

    handlers[LucidShared.ELucidEvent.startParty]({ party, playerId: 'a' });

    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }

    // Партия доехала до игры на настоящем контенте модели, а не откатилась
    // в лобби и не подменилась запасной партией из-за упавшей записи в базу
    expect(party.view('a').phase).toBe(LucidShared.EPartyPhase.PLAYING);
    expect(party.view('a').usedFallback).toBe(false);
  });

  it('сбой записи строки вызова не роняет генерацию в запасную партию', async () => {
    const { handlers, party, storage } = setup();

    vi.spyOn(storage, 'saveGenerationCall').mockImplementation(() => {
      throw new Error('диск недоступен');
    });
    vi.mocked(generateContent).mockImplementationOnce(({ onCall }) => {
      // onCall зовётся из пайплайна так же, как в бою: сам вызов не должен
      // бросить наружу и увести генерацию на запасной контент
      expect(() => onCall?.({
        stage: 'world',
        model: 'test/model',
        attempt: 1,
        inputTokens: 1,
        outputTokens: 1,
        costUsd: 0,
        durationMs: 1,
        outcome: 'ok',
      })).not.toThrow();

      return Promise.resolve({
        content: emptyContent(),
        usedFallback: false,
        stats: {
          durationMs: 500,
          requestedEvents: 1,
          callsCount: 1,
          retriesCount: 0,
        },
      });
    });

    handlers[LucidShared.ELucidEvent.startParty]({ party, playerId: 'a' });

    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }

    expect(party.view('a').phase).toBe(LucidShared.EPartyPhase.PLAYING);
    expect(party.view('a').usedFallback).toBe(false);
  });

  it('номер повторной партии уезжает видом, а не строкой ленты', () => {
    const { handlers, party } = setup();

    handlers[LucidShared.ELucidEvent.playAgain]({ party, playerId: 'a' });

    const nextPartyId = party.view('a').nextPartyId;

    expect(nextPartyId).toBeDefined();
    // Выдирать номер партии из строки, написанной для человека, клиент не должен
    party.takeRibbonDelta().forEach(line => expect(line).not.toContain(nextPartyId!));
  });

  it('повторная партия рождается без подключённых и получает срок удаления', () => {
    const {
      group,
      handlers,
      party,
      sync,
    } = setup();

    handlers[LucidShared.ELucidEvent.playAgain]({ party, playerId: 'a' });

    const next = group.get(party.view('a').nextPartyId!)!;

    expect(next.view('a').members).toHaveLength(2);
    // Места заняты, но ни один человек ещё не подключился: иначе партия
    // выглядит полной и остаётся в базе навсегда, если по ссылке никто не придёт
    expect(next.hasConnected).toBe(false);
    expect(sync).toHaveBeenCalledWith(next);
  });
});

describe('создание партии', () => {
  it('создаёт партию и возвращает её идентификатор', () => {
    const group = createPartyGroup({ storage: createStorage<TPartySnapshot>(':memory:') });
    const callback = vi.fn();

    createParty({ group, ownerId: 'a', sync: vi.fn() }, callback);

    const [result] = callback.mock.calls[0] as [{ status: string; partyId: string }];

    expect(result.status).toBe('ok');
    expect(group.get(result.partyId)).not.toBeNull();
  });

  it('создатель становится владельцем только после входа', () => {
    const group = createPartyGroup({ storage: createStorage<TPartySnapshot>(':memory:') });
    const callback = vi.fn();

    createParty({ group, ownerId: 'a', sync: vi.fn() }, callback);

    const [result] = callback.mock.calls[0] as [{ partyId: string }];
    const party = group.get(result.partyId)!;

    // Владелец назначается при создании, но состав пуст, пока он не подключился
    expect(party.ownerId).toBe('a');
    expect(party.view(party.ownerId).members).toHaveLength(0);
  });
});
