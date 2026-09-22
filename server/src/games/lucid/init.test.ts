import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { createStorage } from '@/games/lucid/storage/db';
import { createPartyGroup } from '@/games/lucid/room/PartyGroup';
import { createHandlers } from '@/games/lucid/init';

const setup = () => {
  const group = createPartyGroup({ storage: createStorage(':memory:') });
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
