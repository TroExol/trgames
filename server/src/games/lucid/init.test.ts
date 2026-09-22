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

const setup = () => {
  const group = createPartyGroup({ storage: createStorage<TPartySnapshot>(':memory:') });
  const party = group.create({ uuid: 'p1', ownerId: 'a' });
  party.join({ playerId: 'a', nickname: 'Аня' });
  party.join({ playerId: 'b', nickname: 'Боря' });

  const broadcast = vi.fn();
  const fail = vi.fn();
  const handlers = createHandlers({ group, broadcast, fail });

  return {
    group,
    party,
    broadcast,
    fail,
    handlers,
  };
};

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

    expect(fail).toHaveBeenCalledWith('a', 'Тема не может быть пустой');
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('запустить партию может только владелец', () => {
    const { handlers, party, fail } = setup();

    handlers[LucidShared.ELucidEvent.startParty]({ party, playerId: 'b' });

    expect(fail).toHaveBeenCalledWith('b', 'Начать партию пока нельзя');
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
