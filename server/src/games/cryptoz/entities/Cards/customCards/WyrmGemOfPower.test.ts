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

import { Logger } from '@/helpers/Logger';
import {
  addCardToPlayerHand,
  addCardToPlayerSeals,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';

import { WyrmGemOfPower } from './WyrmGemOfPower';
import { Discharge } from './Discharge';

describe('WyrmGemOfPower', () => {
  let card: WyrmGemOfPower;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    card = new WyrmGemOfPower(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const instance = new WyrmGemOfPower();
    expect(instance).toBeDefined();
    expect(instance.uuid).toBeDefined();
    expect(instance.id).toBe(CryptozShared.ECardId.WYRM_GEM_OF_POWER);
    expect(instance.name).toBe('Змеиный самоцвет мощи');
    expect(instance.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(instance.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(instance.basePrice).toBe(5);
    expect(instance.baseGloryShards).toBe(0);
    expect(instance.baseEssence).toBe(0);
    expect(instance.isSeal).toBe(true);
    expect(instance.hasEvade).toBe(true);
    expect(instance.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const instance = new WyrmGemOfPower(room);
    expect(instance.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Восстанови 3 здоровья',
      evade: 'Возьми 1 карту',
      other: 'Если у тебя есть 2 карты Змеиный самоцвет мощи, эта карта приносит 5 осколков величия',
    });
  });

  describe('General Handler', () => {
    it('Можно разыграть обычным способом', () => {
      expect(card.canPlayGeneralHandler()).toBe(true);
    });

    it('Восстанавливает 3 здоровья', async () => {
      activePlayer.health = 10;
      await card.play();
      expect(activePlayer.health).toBe(13);
    });

    it('Не восстанавливает здоровье выше максимального', async () => {
      activePlayer.health = 24;
      await card.play();
      expect(activePlayer.health).toBe(25);
    });

    it('Не работает для хаоса', async () => {
      activePlayer.health = 10;
      await card.play({ isForChaos: true });
      expect(activePlayer.health).toBe(10);
    });
  });

  describe('Evade Handler', () => {
    it('Можно разыграть укрытием', () => {
      expect(card.canPlayEvadeHandler()).toBe(true);
    });

    it('При укрытии сбрасывает карту, участник берет новую, урон не проходит', async () => {
      const attackCard = new Discharge(room);
      addCardToPlayerHand(attackCard, activePlayer);

      const evadeCard = new WyrmGemOfPower(room);
      addCardToPlayerSeals(evadeCard, player);

      const initialHandCount = player.hand.count;
      const initialHealth = player.health;

      room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(evadeCard);

      await attackCard.play({ concreteTarget: player });

      expect(player.health).toBe(initialHealth);
      expect(player.seals.getCard(evadeCard)).toBeNull();
      expect(player.discard.getCard(evadeCard)).toBe(evadeCard);
      expect(player.hand.count).toBe(initialHandCount + 1);
    });
  });

  it('Нельзя разыграть печатью, мракобоем, тотальным мракобоем', () => {
    expect(card.canPlaySealHandler()).toBe(false);
    expect(card.canPlayStrikeHandler()).toBe(false);
    expect(card.canPlayTotalDarknessStrikeHandler()).toBe(false);
  });

  describe('getGloryShards', () => {
    it('Возвращает 0 осколков, если у участника меньше 2 карт', () => {
      expect(card.getGloryShards()).toBe(0);
      activePlayer.hand.removeCard(card);
      addCardToPlayerSeals(card, activePlayer);
      expect(card.getGloryShards()).toBe(0);
    });

    it('Возвращает 5 осколков, если у участника 2 или больше таких карт в разных местах', () => {
      const secondCard = new WyrmGemOfPower(room);
      addCardToPlayerSeals(secondCard, activePlayer);
      expect(card.getGloryShards()).toBe(5);
    });

    it('Возвращает 0 осколков, если нет владельца', () => {
      card.changeOwner();
      expect(card.getGloryShards()).toBe(0);
    });
  });
});
