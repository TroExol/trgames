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

import { addCardToPlayerHand, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';
import { MockCard } from '@/games/cryptoz/vitest/utils';

import { WizardsChildren } from './WizardsChildren';

describe('WizardsChildren', () => {
  let card: WizardsChildren;
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
    card = new WizardsChildren(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    expect(card).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.WIZARDS_CHILDREN);
    expect(card.name).toBe('Дети Магов');
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.basePrice).toBe(6);
    expect(card.baseEssence).toBe(3);
    expect(card.baseGloryShards).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+3 эссенции',
      strike: 'Нанеси 2 урона каждому противнику за каждое укрытие в его сбросе',
    });
  });

  it('Разыгрывает general: +3 эссенции', async () => {
    activePlayer.arena.addCardToTop(card);
    await card.playGeneral();
    expect(activePlayer.essenceToSpend).toBe(3);
  });

  it('Разыгрывает strike без карт укрытия в сбросе', async () => {
    activePlayer.arena.addCardToTop(card);
    const initialHealth = enemyPlayer.health;
    await card.playStrike({ canEvade: false });

    // Урон не должен быть нанесен, так как нет карт укрытия в сбросе
    expect(enemyPlayer.health).toBe(initialHealth);
  });

  it('Разыгрывает strike с картами укрытия в сбросе', async () => {
    // Создаем карты укрытия и добавляем их в сброс противника
    const evadeCard1 = new MockCard({ room, hasEvade: true });
    const evadeCard2 = new MockCard({ room, hasEvade: true });
    const normalCard = new MockCard({ room, hasEvade: false });

    enemyPlayer.discard.addCardToTop(evadeCard1);
    enemyPlayer.discard.addCardToTop(normalCard);
    enemyPlayer.discard.addCardToTop(evadeCard2);

    activePlayer.arena.addCardToTop(card);
    const initialHealth = enemyPlayer.health;
    await card.playStrike({ canEvade: false });

    // Должно быть нанесено 4 урона (2 карты укрытия * 2 урона)
    expect(enemyPlayer.health).toBe(initialHealth - 4);
  });

  it('Разыгрывает strike с конкретной целью', async () => {
    // Создаем карты укрытия и добавляем их в сброс противника
    const evadeCard1 = new MockCard({ room, hasEvade: true });
    const evadeCard2 = new MockCard({ room, hasEvade: true });
    const normalCard = new MockCard({ room, hasEvade: false });

    enemyPlayer.discard.addCardToTop(evadeCard1);
    enemyPlayer.discard.addCardToTop(normalCard);
    enemyPlayer.discard.addCardToTop(evadeCard2);

    activePlayer.arena.addCardToTop(card);
    const initialHealth = enemyPlayer.health;

    // Играем strike с конкретной целью
    await card.playStrike({ concreteTarget: enemyPlayer, canEvade: false });

    // Должно быть нанесено 4 урона (2 карты укрытия * 2 урона)
    expect(enemyPlayer.health).toBe(initialHealth - 4);
  });

  it('Не наносится урон, если цель укрылась', async () => {
    const evadeCard1 = new MockCard({ room, hasEvade: true });
    enemyPlayer.discard.addCardToTop(evadeCard1);
    activePlayer.arena.addCardToTop(card);
    vi.spyOn(enemyPlayer, 'tryEvade').mockResolvedValue(true);
    const initialHealth = enemyPlayer.health;
    await card.playStrike({ canEvade: true });
    expect(enemyPlayer.health).toBe(initialHealth);
  });

  it('Не наносится урон, если обе цели укрылись', async () => {
    // Добавляем второго врага
    const mocks = createMockRoomWithPlayers();
    const secondEnemy = mocks.player;
    room.players.array.push(secondEnemy);
    const evadeCard1 = new MockCard({ room, hasEvade: true });
    const evadeCard2 = new MockCard({ room, hasEvade: true });
    enemyPlayer.discard.addCardToTop(evadeCard1);
    secondEnemy.discard.addCardToTop(evadeCard2);
    activePlayer.arena.addCardToTop(card);
    vi.spyOn(enemyPlayer, 'tryEvade').mockResolvedValue(true);
    vi.spyOn(secondEnemy, 'tryEvade').mockResolvedValue(true);
    const initialHealth1 = enemyPlayer.health;
    const initialHealth2 = secondEnemy.health;
    await card.playStrike({ canEvade: true });
    expect(enemyPlayer.health).toBe(initialHealth1);
    expect(secondEnemy.health).toBe(initialHealth2);
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
