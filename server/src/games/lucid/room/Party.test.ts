import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { Party, THEME_HINTS } from '@/games/lucid/room/Party';

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

describe('жеребьёвка темы', () => {
  const partyWithThemes = (uuid: string) => {
    const party = new Party({ uuid, ownerId: 'a' });
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'b', nickname: 'Боря' });
    party.join({ playerId: 'c', nickname: 'Вася' });

    return party;
  };

  it('выбирает одну из предложенных тем', () => {
    const party = partyWithThemes('draw-1');
    party.proposeTheme('a', 'пираты');
    party.proposeTheme('b', 'киберпанк');
    party.declineTheme('c');

    expect(['пираты', 'киберпанк']).toContain(party.drawTheme());
  });

  it('жеребьёвка воспроизводима: та же партия даёт тот же выбор', () => {
    const first = partyWithThemes('draw-same');
    first.proposeTheme('a', 'пираты');
    first.proposeTheme('b', 'киберпанк');

    const second = partyWithThemes('draw-same');
    second.proposeTheme('a', 'пираты');
    second.proposeTheme('b', 'киберпанк');

    expect(first.drawTheme()).toBe(second.drawTheme());
  });

  it('отказавшийся в жеребьёвке не участвует', () => {
    const party = partyWithThemes('draw-decline');
    party.declineTheme('a');
    party.declineTheme('b');
    party.proposeTheme('c', 'офис');

    expect(party.drawTheme()).toBe('офис');
  });

  it('если не предложил никто, тема берётся из подсказок', () => {
    const party = partyWithThemes('draw-empty');
    party.declineTheme('a');

    expect(THEME_HINTS).toContain(party.drawTheme());
  });
});

describe('старт партии', () => {
  const readyParty = (uuid: string) => {
    const party = new Party({ uuid, ownerId: 'a' });
    party.join({ playerId: 'a', nickname: 'Аня' });
    party.join({ playerId: 'b', nickname: 'Боря' });
    party.proposeTheme('a', 'пираты');
    party.declineTheme('b');

    return party;
  };

  const content = (): LucidShared.TPartyContent => ({
    theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['#102030', '#405060', '#708090'] },
    events: {},
  });

  it('одному играть нельзя', () => {
    const party = new Party({ uuid: 'alone', ownerId: 'a' });
    party.join({ playerId: 'a', nickname: 'Аня' });

    expect(party.canStart).toBe(false);
  });

  it('во время генерации партия в соответствующей фазе', async () => {
    const party = readyParty('start-phase');
    const started = party.start({
      generate: () => Promise.resolve({ content: content(), usedFallback: false }),
    });

    expect(party.view('a').phase).toBe(LucidShared.EPartyPhase.GENERATING);

    await started;
  });

  it('после генерации партия играется и состояние видно игроку', async () => {
    const party = readyParty('start-done');

    await party.start({ generate: () => Promise.resolve({ content: content(), usedFallback: false }) });

    const view = party.view('a');

    expect(view.phase).toBe(LucidShared.EPartyPhase.PLAYING);
    expect(view.state?.ctx.phase).toBe(LucidShared.EPhase.ROLL);
    expect(view.state?.you).toBe('a');
    expect(view.theme?.name).toBe('Пираты');
  });

  it('тема мира приходит раньше состояния', async () => {
    const party = readyParty('start-world');
    const seen: (string | undefined)[] = [];

    await party.start({
      generate: ({ onWorld }) => {
        onWorld({ name: 'Ранний мир', resourceName: 'монеты', palette: ['#111111'] });
        seen.push(party.view('a').theme?.name);
        seen.push(party.view('a').state?.you);

        return Promise.resolve({ content: content(), usedFallback: false });
      },
    });

    expect(seen).toEqual(['Ранний мир', undefined]);
  });

  it('игра на запасной партии отмечена', async () => {
    const party = readyParty('start-fallback');

    await party.start({ generate: () => Promise.resolve({ content: content(), usedFallback: true }) });

    expect(party.view('a').usedFallback).toBe(true);
  });

  it('ход принимается и меняет состояние', async () => {
    const party = readyParty('start-move');
    await party.start({ generate: () => Promise.resolve({ content: content(), usedFallback: false }) });

    const before = party.view('a').state!;
    party.applyMove({
      type: LucidShared.EMoveType.ROLL,
      playerId: before.ctx.currentPlayer,
      stateId: before.stateId,
    });

    expect(party.view('a').state!.stateId).toBe(before.stateId + 1);
  });

  it('ход чужого игрока не проходит', async () => {
    const party = readyParty('start-foreign');
    await party.start({ generate: () => Promise.resolve({ content: content(), usedFallback: false }) });

    const before = party.view('a').state!;
    const other = before.ctx.currentPlayer === 'a' ? 'b' : 'a';

    party.applyMove({ type: LucidShared.EMoveType.ROLL, playerId: other, stateId: before.stateId });

    expect(party.view('a').state!.stateId).toBe(before.stateId);
  });
});
