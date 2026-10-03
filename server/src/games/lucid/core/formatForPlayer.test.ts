import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { lineTrack, makeG } from '@/games/lucid/vitest/factories';
import { setupParty } from '@/games/lucid/core/setup';
import { formatForPlayer } from '@/games/lucid/core/formatForPlayer';

const makeParty = (): LucidShared.TState => {
  const state = setupParty({
    seed: 'view',
    players: [{ id: 'a', nickname: 'Аня' }, { id: 'b', nickname: 'Боря' }],
    content: {
      theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['#001122'] },
      events: {
        1: { cellId: 1, title: 'Открытая', text: 'Видно', options: [] },
        9: { cellId: 9, title: 'Закрытая', text: 'Секрет', options: [] },
      },
    },
  });

  state.G.visited = [0, 1];

  return state;
};

describe('formatForPlayer', () => {
  it('отдаёт события только открытых клеток', () => {
    const view = formatForPlayer(makeParty(), 'a');

    expect(view.G.events[1]).toBeDefined();
    expect(view.G.events[9]).toBeUndefined();
  });

  it('не отдаёт состояние генератора случайных чисел', () => {
    expect('random' in formatForPlayer(makeParty(), 'a').G).toBe(false);
  });

  it('не отдаёт журнал партии: он уходит лентой, а не целиком', () => {
    expect('log' in formatForPlayer(makeParty(), 'a').G).toBe(false);
  });

  it('форма трека видна целиком: по ней рисуется поле', () => {
    const state = makeParty();

    expect(formatForPlayer(state, 'a').G.track.cells).toHaveLength(state.G.track.cells.length);
  });

  it('сообщает получателю, кто он', () => {
    expect(formatForPlayer(makeParty(), 'b').you).toBe('b');
  });

  it('версия состояния сохраняется', () => {
    const state = makeParty();

    expect(formatForPlayer(state, 'a').stateId).toBe(state.stateId);
  });

  it('отдаёт последний бросок', () => {
    const state = makeParty();

    state.G.lastRoll = { playerId: 'a', value: 4 };

    expect(formatForPlayer(state, 'a').G.lastRoll).toEqual({ playerId: 'a', value: 4 });
  });

  it('отдаёт роли игроков: они не секрет', () => {
    const state = setupParty({
      seed: 'roles',
      players: [{ id: 'a', nickname: 'Аня' }, { id: 'b', nickname: 'Боря' }],
      content: {
        theme: { name: 'Пираты', resourceName: 'дублоны', palette: ['#001122'] },
        events: {},
        roles: [{ nickname: 'Аня', role: 'хранитель компаса' }],
      },
    });

    expect(formatForPlayer(state, 'a').G.players.a.role).toBe('хранитель компаса');
    expect(formatForPlayer(state, 'a').G.players.b.role).toBeUndefined();
  });
});

const baseOption = (overrides: Partial<LucidShared.TOption> = {}): LucidShared.TOption => ({
  text: 'Вскрыть ящик ломом',
  threshold: 4,
  success: { atoms: [{ kind: LucidShared.EAtomKind.RESOURCE, target: LucidShared.ETarget.SELF, value: 3 }] },
  failure: { atoms: [{ kind: LucidShared.EAtomKind.RESOURCE, target: LucidShared.ETarget.SELF, value: -1 }] },
  ...overrides,
});

const historyEntry = (overrides: Partial<LucidShared.THistoryEntry> = {}): LucidShared.THistoryEntry => ({
  playerId: 'a',
  nickname: 'Аня',
  optionIndex: 0,
  branch: 'success',
  roll: 5,
  lines: ['Аня выбирает «Вскрыть ящик ломом»', 'Аня бросает кубик: 5 против порога 4', 'Аня: заряды +3'],
  ...overrides,
});

const stateWith = (
  event: LucidShared.TEvent,
  cellHistory: Record<number, LucidShared.THistoryEntry[]>,
): LucidShared.TState => {
  const G = makeG({ track: lineTrack(), events: { 1: event } });

  G.visited = [0, 1];
  G.cellHistory = cellHistory;

  return {
    G,
    ctx: { currentPlayer: 'a', turn: 1, numPlayers: 2, phase: LucidShared.EPhase.ROLL },
    stateId: 0,
  };
};

describe('formatForPlayer — раскрытие веток варианта', () => {
  it('без истории обе ветки скрыты, но text/threshold/cost остаются', () => {
    const event: LucidShared.TEvent = { cellId: 1, title: 'Ящик', text: 'Заперт', options: [baseOption({ cost: 2 })] };
    const state = stateWith(event, {});

    const view = formatForPlayer(state, 'a');
    const option = view.G.events[1].options[0];

    expect(option).toEqual({
      text: 'Вскрыть ящик ломом',
      threshold: 4,
      cost: 2,
      revealed: { success: false, failure: false },
      success: undefined,
      failure: undefined,
    });
  });

  it('раскрытая success-ветка отдаёт success, failure остаётся скрытой', () => {
    const event: LucidShared.TEvent = { cellId: 1, title: 'Ящик', text: 'Заперт', options: [baseOption()] };
    const state = stateWith(event, { 1: [historyEntry({ branch: 'success' })] });

    const option = formatForPlayer(state, 'a').G.events[1].options[0];

    expect(option.revealed).toEqual({ success: true, failure: false });
    expect(option.success).toEqual(baseOption().success);
    expect(option.failure).toBeUndefined();
  });

  it('раскрытая failure-ветка без описанного failure отдаёт revealed.failure=true и failure=undefined', () => {
    const event: LucidShared.TEvent = {
      cellId: 1,
      title: 'Ящик',
      text: 'Заперт',
      options: [baseOption({ failure: undefined })],
    };
    const state = stateWith(event, { 1: [historyEntry({ branch: 'failure', roll: 2 })] });

    const option = formatForPlayer(state, 'a').G.events[1].options[0];

    // Раскрыта, но пуста: revealed.failure=true отличает это от «ещё не раскрыта»
    expect(option.revealed).toEqual({ success: false, failure: true });
    expect(option.failure).toBeUndefined();
  });

  it('cellHistory уезжает клиенту целиком', () => {
    const event: LucidShared.TEvent = { cellId: 1, title: 'Ящик', text: 'Заперт', options: [baseOption()] };
    const entry = historyEntry();
    const state = stateWith(event, { 1: [entry] });

    expect(formatForPlayer(state, 'a').G.cellHistory).toEqual({ 1: [entry] });
  });
});
