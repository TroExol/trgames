import {
  describe,
  expect,
  it,
} from 'vitest';

import { getInitialAbilityMasterDeck } from './utils';

describe('Abilities утилиты', () => {
  it('Создает начальную основную стопку', () => {
    const deck = getInitialAbilityMasterDeck();
    expect(deck.count).toBe(8);
  });
});
