import type { LucidShared } from '@trgames/shared';

import {
  describe,
  expect,
  it,
} from 'vitest';

import type { TPartySnapshot } from '@/games/lucid/room/Party';

import { createStorage } from '@/games/lucid/storage/db';
import { createPartyGroup } from '@/games/lucid/room/PartyGroup';

const content = (): LucidShared.TPartyContent => ({
  theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['#102030'] },
  events: {},
});

const startedParty = async (group: ReturnType<typeof createPartyGroup>, uuid: string) => {
  const party = group.create({ uuid, ownerId: 'a' });
  party.join({ playerId: 'a', nickname: 'Аня' });
  party.join({ playerId: 'b', nickname: 'Боря' });
  party.proposeTheme('a', 'пираты');
  await party.start({ generate: () => Promise.resolve({ content: content(), usedFallback: false }) });
  // persist() не вызывается автоматически нигде в Party/PartyGroup — это ручной
  // рычаг для вызывающего кода (см. обработчик makeMove в задаче 11 и сквозной
  // тест восстановления после хода). Без явного вызова здесь эта партия
  // в хранилище останется в виде пустого снимка, сделанного при create()
  group.persist(party);

  return party;
};

describe('PartyGroup', () => {
  it('созданная партия находится по идентификатору', () => {
    const group = createPartyGroup({ storage: createStorage<TPartySnapshot>(':memory:') });
    group.create({ uuid: 'p1', ownerId: 'a' });

    expect(group.get('p1')?.uuid).toBe('p1');
  });

  it('несуществующая партия не находится', () => {
    const group = createPartyGroup({ storage: createStorage<TPartySnapshot>(':memory:') });

    expect(group.get('нет-такой')).toBeNull();
  });

  it('партия переживает перезапуск сервера', async () => {
    const storage = createStorage<TPartySnapshot>(':memory:');
    const group = createPartyGroup({ storage });
    const party = await startedParty(group, 'p1');
    const before = party.view('a').state!;

    // Новый набор партий — как будто сервер перезапустили: память пуста,
    // а база на месте
    const afterRestart = createPartyGroup({ storage });
    const restored = afterRestart.get('p1');

    expect(restored?.view('a').state?.stateId).toBe(before.stateId);
    expect(restored?.view('a').members).toHaveLength(2);
  });

  it('удалённая партия не восстанавливается', async () => {
    const storage = createStorage<TPartySnapshot>(':memory:');
    const group = createPartyGroup({ storage });
    await startedParty(group, 'p1');
    group.remove('p1');

    expect(createPartyGroup({ storage }).get('p1')).toBeNull();
  });

  it('persist после удаления не воскрешает партию зомби-записью', async () => {
    const storage = createStorage<TPartySnapshot>(':memory:');
    const group = createPartyGroup({ storage });
    const party = await startedParty(group, 'p1');

    group.remove('p1');
    // Долгая генерация могла всё ещё держать ссылку на party и прислать
    // persist уже после того, как уборка удалила партию из группы
    group.persist(party);

    expect(createPartyGroup({ storage }).get('p1')).toBeNull();
  });
});
