import {
  describe,
  expect,
  it,
} from 'vitest';
import { CryptozShared } from '@trgames/shared';

import { createMockRoom } from '@/games/cryptoz/vitest/utils';

import {
  getInitialCardMasterDeck,
  getInitialCompanions,
  getInitialCursedSeals,
  getInitialDarknessMadness,
  getInitialHarbingers,
  getInitialPlayerDeck,
} from './utils';

describe('Cards утилиты', () => {
  it('Создает начальную личную стопку участника', () => {
    const deck = getInitialPlayerDeck();
    expect(deck.count).toBe(10);
    expect(deck.getCardsById(CryptozShared.ECardId.DISCHARGE).count).toBe(1);
    expect(deck.getCardsById(CryptozShared.ECardId.DARKNESS_SHARD).count).toBe(6);
    expect(deck.getCardsById(CryptozShared.ECardId.OBLIVION).count).toBe(3);
  });

  it('Создает начальную личную стопку участника с комнатой', () => {
    const room = createMockRoom();
    const deck = getInitialPlayerDeck(room);
    expect(deck.count).toBe(10);
    expect(deck.getCardsById(CryptozShared.ECardId.DISCHARGE).count).toBe(1);
    expect(deck.getCardsById(CryptozShared.ECardId.DARKNESS_SHARD).count).toBe(6);
    expect(deck.getCardsById(CryptozShared.ECardId.OBLIVION).count).toBe(3);
    deck.array.forEach(card => expect(card.room).toBe(room));
  });

  it('Создает начальную стопку безумия тьмы', () => {
    const room = createMockRoom();
    const cards1 = getInitialDarknessMadness({ room, maxPlayers: 5 });
    expect(cards1.count).toBe(16);
    expect(cards1.getCardsById(CryptozShared.ECardId.DARKNESS_MADNESS).count).toBe(16);
    cards1.array.forEach(card => expect(card.room).toBe(room));

    const cards2 = getInitialDarknessMadness({ room, maxPlayers: 1 });
    expect(cards2.count).toBe(16);
    expect(cards2.getCardsById(CryptozShared.ECardId.DARKNESS_MADNESS).count).toBe(16);
    cards2.array.forEach(card => expect(card.room).toBe(room));

    const cards3 = getInitialDarknessMadness({ room, maxPlayers: 8 });
    expect(cards3.count).toBe(25);
    expect(cards3.getCardsById(CryptozShared.ECardId.DARKNESS_MADNESS).count).toBe(25);
    cards3.array.forEach(card => expect(card.room).toBe(room));
  });

  it('Создает начальную стопку проклятых печатей', () => {
    const room = createMockRoom();
    const cards1 = getInitialCursedSeals({ room, maxPlayers: 5 });
    expect(cards1.count).toBe(16);
    expect(cards1.getCardsById(CryptozShared.ECardId.CURSED_SEAL).count).toBe(16);
    cards1.array.forEach(card => expect(card.room).toBe(room));

    const cards2 = getInitialCursedSeals({ room, maxPlayers: 1 });
    expect(cards2.count).toBe(16);
    expect(cards2.getCardsById(CryptozShared.ECardId.CURSED_SEAL).count).toBe(16);
    cards2.array.forEach(card => expect(card.room).toBe(room));

    const cards3 = getInitialCursedSeals({ room, maxPlayers: 8 });
    expect(cards3.count).toBe(25);
    expect(cards3.getCardsById(CryptozShared.ECardId.CURSED_SEAL).count).toBe(25);
    cards3.array.forEach(card => expect(card.room).toBe(room));
  });

  it('Создает начальную стопку помощников', () => {
    const room = createMockRoom();
    const cards = getInitialCompanions(room);
    expect(cards.count).toBe(12);
    expect(cards.getCountCardsByType(CryptozShared.ECardType.COMPANION)).toBe(12);
    expect(new Set(cards.ids).size).toBe(12);
    cards.array.forEach(card => expect(card.room).toBe(room));
  });

  it('Создает начальную стопку', () => {
    const room = createMockRoom();
    const cards = getInitialCardMasterDeck(room);
    const countUniqueCreatures = 13;
    const countCreatures = 23;
    const countUniqueWickedness = 13;
    const countWickedness = 23;
    const countUniqueRitual = 13;
    const countRitual = 23;
    const countUniqueArtifact = 13;
    const countArtifact = 23;
    const countUniqueCrypt = 6;
    const countUniqueChaos = 26;
    expect(new Set(cards.getCardsByType(CryptozShared.ECardType.CREATURE).ids).size).toBe(countUniqueCreatures);
    expect(cards.getCountCardsByType(CryptozShared.ECardType.CREATURE)).toBe(countCreatures);
    expect(new Set(cards.getCardsByType(CryptozShared.ECardType.WICKEDNESS).ids).size).toBe(countUniqueWickedness);
    expect(cards.getCountCardsByType(CryptozShared.ECardType.WICKEDNESS)).toBe(countWickedness);
    expect(new Set(cards.getCardsByType(CryptozShared.ECardType.RITUAL).ids).size).toBe(countUniqueRitual);
    expect(cards.getCountCardsByType(CryptozShared.ECardType.RITUAL)).toBe(countRitual);
    expect(new Set(cards.getCardsByType(CryptozShared.ECardType.ARTIFACT).ids).size).toBe(countUniqueArtifact);
    expect(cards.getCountCardsByType(CryptozShared.ECardType.ARTIFACT)).toBe(countArtifact);
    expect(new Set(cards.getCardsByType(CryptozShared.ECardType.CRYPT).ids).size).toBe(countUniqueCrypt);
    expect(cards.getCountCardsByType(CryptozShared.ECardType.CRYPT)).toBe(countUniqueCrypt);
    expect(new Set(cards.getCardsByType(CryptozShared.ECardType.CHAOS).ids).size).toBe(countUniqueChaos);
    expect(cards.getCountCardsByType(CryptozShared.ECardType.CHAOS)).toBe(countUniqueChaos);
    expect(cards.count)
      .toBe(countCreatures + countWickedness + countRitual + countArtifact + countUniqueCrypt + countUniqueChaos);
    cards.array.forEach(card => expect(card.room).toBe(room));
  });

  it('Создает начальную стопку предвестников', () => {
    const room = createMockRoom();
    const cards = getInitialHarbingers({ room, maxPlayers: 5 });
    expect(cards.count).toBe(12);
    expect(cards.getCountCardsByType(CryptozShared.ECardType.HARBINGER)).toBe(12);
    expect(cards.top!.id).toBe(CryptozShared.ECardId.DREAD_ONE_EYED_WARRIOR);
    cards.array.forEach(card => expect(card.room).toBe(room));

    const cards2 = getInitialHarbingers({ room, maxPlayers: 1 });
    expect(cards2.count).toBe(12);
    expect(cards2.getCountCardsByType(CryptozShared.ECardType.HARBINGER)).toBe(12);
    cards2.array.forEach(card => expect(card.room).toBe(room));

    const cards3 = getInitialHarbingers({ room, maxPlayers: 8 });
    expect(cards3.count).toBe(24);
    expect(cards3.getCountCardsByType(CryptozShared.ECardType.HARBINGER)).toBe(24);
    cards3.array.forEach(card => expect(card.room).toBe(room));
  });
});
