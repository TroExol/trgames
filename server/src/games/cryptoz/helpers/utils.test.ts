import {
  describe,
  expect,
  it,
} from 'vitest';

import { createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';

import { toPlayerVariant } from './utils';

describe('Утилиты игры Кровь и Блуд', () => {
  describe('toPlayerVariant', () => {
    it('Корректно возвращает значения', () => {
      const { activePlayer } = createMockRoomWithPlayers();
      expect(toPlayerVariant(activePlayer)).toEqual({ id: activePlayer.nickname, value: activePlayer.nickname });
    });
  });
});
