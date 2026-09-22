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
  const sync = vi.fn();
  const handlers = createHandlers({
    group,
    broadcast,
    fail,
    sync,
  });

  return {
    group,
    party,
    broadcast,
    fail,
    sync,
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
