import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import {
  addCardToPlayerDeck,
  addCardToPlayerHand,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { PrisonerOfDarkness } from './PrisonerOfDarkness';

describe('PrisonerOfDarkness', () => {
  let card: PrisonerOfDarkness;
  let room: Room;
  let activePlayer: Player;
  let enemyPlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    enemyPlayer = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    enemyPlayer.discardHand(enemyPlayer.hand);
    card = new PrisonerOfDarkness(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    expect(card).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.PRISONER_OF_DARKNESS);
    expect(card.name).toBe('Пленница Мрака');
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.basePrice).toBe(3);
    expect(card.baseEssence).toBe(2);
    expect(card.baseGloryShards).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции',
      strike: 'Противник раскрывает верхнюю карту стопки и получает урон, равный ее стоимости',
    });
    expect(card['getDescription'](true)).toEqual({
      general: '+2 эссенции',
      strike: 'Противник раскрывает верхнюю карту стопки и получает урон, равный ее стоимости',
    });
  });

  it('Разыгрывает general: +2 эссенции', async () => {
    activePlayer.arena.addCardToTop(card);
    const initialEssence = activePlayer.essenceToSpend;
    await card.playGeneral();
    expect(activePlayer.essenceToSpend).toBe(initialEssence + card.getEssence(2, activePlayer));
  });

  it('Разыгрывает strike: цель получает урон по стоимости верхней карты', async () => {
    const testCard = new MockCard({ room, price: 4 });
    addCardToPlayerDeck(testCard, enemyPlayer);
    activePlayer.arena.addCardToTop(card);
    const initialHealth = enemyPlayer.health;
    await card.playStrike({ concreteTarget: enemyPlayer, canEvade: false });
    expect(enemyPlayer.health).toBe(initialHealth - card.getDamage(4, activePlayer, enemyPlayer));
  });

  it('Разыгрывает strike: цель может укрыться', async () => {
    const testCard = new MockCard({ room, price: 3 });
    addCardToPlayerDeck(testCard, enemyPlayer);
    activePlayer.arena.addCardToTop(card);
    vi.spyOn(enemyPlayer, 'tryEvade').mockResolvedValue(true);
    const initialHealth = enemyPlayer.health;
    await card.playStrike({ concreteTarget: enemyPlayer, canEvade: true });
    expect(enemyPlayer.health).toBe(initialHealth);
  });

  it('Разыгрывает strike: если стопка пуста, fillDeck вызывается', async () => {
    // Очищаем стопку и сброс, чтобы fillDeck не смог ничего добавить
    enemyPlayer.deck.clear();
    enemyPlayer.discard.clear();
    activePlayer.arena.addCardToTop(card);
    const initialHealth = enemyPlayer.health;
    await card.playStrike({ concreteTarget: enemyPlayer, canEvade: false });
    expect(enemyPlayer.health).toBe(initialHealth); // урона не будет
  });

  it('Нельзя разыграть печатью', async () => {
    await card.playSeal({ isForChaos: false });
    expect(card.canPlaySealHandler()).toBeFalsy();
  });

  it('Нельзя разыграть тотальным мракобоем', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытием', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });
});
