import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { makeG } from '@/games/lucid/vitest/factories';
import { upgradeG } from '@/games/lucid/core/upgrade';

describe('upgradeG', () => {
  it('партия до законов получает пустые ячейки и свежий ход', () => {
    const old: Partial<LucidShared.TG> = makeG();

    delete old.cards;
    delete old.turn;

    const upgraded = upgradeG(old as LucidShared.TG);

    expect(upgraded.cards.laws).toEqual([null, null, null]);
    expect(upgraded.cards.lawDeck).toEqual([]);
    expect(upgraded.turn).toEqual({ step: LucidShared.ETurnStep.START, fired: [], extraTurn: false, used: [] });
  });

  it('новая партия не меняется', () => {
    const G = makeG();

    expect(upgradeG(G)).toEqual(G);
  });
});
