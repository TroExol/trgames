import {
  describe,
  expect,
  it,
} from 'vitest';

import { Party } from '@/games/lucid/room/Party';

const makeParty = () => new Party({ uuid: 'p1', ownerId: 'a' });

describe('состав партии', () => {
  it('первый вошедший становится владельцем', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });

    expect(party.view('a').ownerId).toBe('a');
  });

  it('вошедшие видны всем', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'b', nickname: 'Боря' });

    expect(party.view('a').members.map(member => member.nickname)).toEqual(['Аня', 'Боря']);
  });

  it('ник, занятый другим игроком, отклоняется', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });

    expect(() => party.join({ playerId: 'b', nickname: 'Аня' })).toThrow();
  });

  it('тот же игрок входит повторно и не удваивается', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'a', nickname: 'Аня' });

    expect(party.view('a').members).toHaveLength(1);
  });

  it('возвращение под другим ником не создаёт нового игрока', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'a', nickname: 'Анна' });

    const [member] = party.view('a').members;

    expect(member.nickname).toBe('Анна');
    expect(party.view('a').members).toHaveLength(1);
  });

  it('потеря связи не убирает игрока из состава', () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.disconnect('a');

    const [member] = party.view('a').members;

    expect(member.isConnected).toBe(false);
    expect(party.view('a').members).toHaveLength(1);
  });
});

describe('предложения темы', () => {
  const partyWithTwo = () => {
    const party = makeParty();
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'b', nickname: 'Боря' });

    return party;
  };

  it('предложение видно всем до жеребьёвки', () => {
    const party = partyWithTwo();
    party.proposeTheme('a', 'пираты');

    const [member] = party.view('b').members;

    expect(member.themeProposal).toBe('пираты');
    expect(member.hasAnswered).toBe(true);
  });

  it('отказ тоже считается ответом', () => {
    const party = partyWithTwo();
    party.declineTheme('a');

    const [member] = party.view('b').members;

    expect(member.themeProposal).toBeUndefined();
    expect(member.hasAnswered).toBe(true);
  });

  it('предложение можно заменить, пока партия не началась', () => {
    const party = partyWithTwo();
    party.proposeTheme('a', 'пираты');
    party.proposeTheme('a', 'киберпанк');

    expect(party.view('a').members[0].themeProposal).toBe('киберпанк');
  });

  it('пустое предложение отклоняется', () => {
    const party = partyWithTwo();

    expect(() => party.proposeTheme('a', '   ')).toThrow();
  });

  it('слишком длинное предложение отклоняется', () => {
    const party = partyWithTwo();

    expect(() => party.proposeTheme('a', 'т'.repeat(201))).toThrow();
  });
});
