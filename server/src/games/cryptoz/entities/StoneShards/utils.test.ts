import {
  describe,
  expect,
  it,
} from 'vitest';

import { getInitialStoneShardMasterDeck } from './utils';

describe('StoneShards утилиты', () => {
  it('Создает начальную основную стопку', () => {
    const deck = getInitialStoneShardMasterDeck();
    expect(deck.count).toBe(20);
  });
});
