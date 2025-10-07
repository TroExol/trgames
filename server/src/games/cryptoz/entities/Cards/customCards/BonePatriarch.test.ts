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
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import type { AbstractAbility } from '../../Abilities/AbstractAbility';

import { BonePatriarch } from './BonePatriarch';
import { Ability1 } from '../../Abilities/customAbilities/Ability1';

describe('BonePatriarch', () => {
  let card: BonePatriarch;
  let room: Room;
  let activePlayer: Player;
  let player: Player;
  let ability: AbstractAbility;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayer.discardHand(activePlayer.hand);
    player.discardHand(player.hand);
    card = new BonePatriarch(room);
    ability = new Ability1(room);
    room.abilities.clear();
    room.abilities.addAbilityToBottom(ability);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const instance = new BonePatriarch();
    expect(instance).toBeDefined();
    expect(instance.uuid).toBeDefined();
    expect(instance.id).toBe(CryptozShared.ECardId.BONE_PATRIARCH);
    expect(instance.name).toBe('Костяной Патриарх');
    expect(instance.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(instance.type).toBe(CryptozShared.ECardType.HARBINGER);
    expect(instance.basePrice).toBe(10);
    expect(instance.baseGloryShards).toBe(5);
    expect(instance.baseEssence).toBe(3);
    expect(instance.isSeal).toBe(false);
    expect(instance.hasEvade).toBe(false);
    expect(instance.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const instance = new BonePatriarch(room);
    expect(instance).toBeDefined();
    expect(instance.id).toBe(CryptozShared.ECardId.BONE_PATRIARCH);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+3 эссенции. Получи случайную дополнительную способность пока жив текущий предвестник',
      totalStrike: 'Здоровье всех участников становится столько, сколько у самого слабого участника',
    });
  });

  describe('General', () => {
    it('Дает 3 эссенции и способность', async () => {
      const initialEssence = activePlayer.essenceToSpend;
      const initialAbilitiesCount = activePlayer.abilities.count;

      await card.play();

      expect(activePlayer.essenceToSpend).toBe(initialEssence + 3);
      expect(activePlayer.abilities.count).toBe(initialAbilitiesCount + 1);
      expect(activePlayer.abilities.getAbility(ability)).not.toBeNull();
    });

    it('Забирает способность при покупке нового предвестника', async () => {
      await card.play();
      const initialRoomAbilitiesCount = room.abilities.count;
      const initialAbilitiesCount = activePlayer.abilities.count;

      activePlayer.triggersOnCardBought.apply(new MockCard({ room, type: CryptozShared.ECardType.HARBINGER }), 2, 'harbinger');

      expect(activePlayer.abilities.count).toBe(initialAbilitiesCount - 1);
      expect(room.abilities.count).toBe(initialRoomAbilitiesCount + 1);
    });

    it('Не дает способность, если их нет', async () => {
      room.abilities.clear();
      const initialAbilitiesCount = activePlayer.abilities.count;

      await card.play();

      expect(activePlayer.abilities.count).toBe(initialAbilitiesCount);
    });
  });

  describe('Total Strike', () => {
    it('Устанавливает здоровье всех участников равному минимальному', async () => {
      activePlayer.health = 10;
      player.health = 5;
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      await card.playTotalDarknessStrike();

      expect(activePlayer.health).toBe(5);
      expect(player.health).toBe(5);
    });

    it('Не меняет здоровье защищенных участников', async () => {
      activePlayer.health = 10;
      player.health = 5;
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(false);

      await card.playTotalDarknessStrike();

      expect(activePlayer.health).toBe(10);
      expect(player.health).toBe(5);
    });

    it('Ничего не происходит, если все защищены', async () => {
      activePlayer.health = 10;
      player.health = 5;
      activePlayer.tryEvade = vi.fn().mockResolvedValue(true);
      player.tryEvade = vi.fn().mockResolvedValue(true);

      await card.playTotalDarknessStrike();

      expect(activePlayer.health).toBe(10);
      expect(player.health).toBe(5);
    });

    it('Работает корректно с одним участником', async () => {
      activePlayer.tryEvade = vi.fn().mockResolvedValue(false);
      room.players.removePlayer(player);

      await card.playTotalDarknessStrike();

      expect(activePlayer.health).toBe(20);
    });
  });
});
