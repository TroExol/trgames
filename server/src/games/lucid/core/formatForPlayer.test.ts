import type { LucidShared } from '@trgames/shared';

import {
  describe,
  expect,
  it,
} from 'vitest';

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
});
