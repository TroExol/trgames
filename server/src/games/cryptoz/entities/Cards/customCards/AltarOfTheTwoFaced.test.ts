import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { v4 as uuidv4 } from 'uuid';
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
import { HealModifier } from '@/games/cryptoz/customModifiers/HealModifier';

import { AltarOfTheTwoFaced } from './AltarOfTheTwoFaced';

describe('AltarOfTheTwoFaced', () => {
  let card: AltarOfTheTwoFaced;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new AltarOfTheTwoFaced(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new AltarOfTheTwoFaced();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.ALTAR_OF_THE_TWO_FACED);
    expect(card.name).toBe('Алтарь двуликого');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CRYPT);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(true);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new AltarOfTheTwoFaced(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.ALTAR_OF_THE_TWO_FACED);
    expect(card.name).toBe('Алтарь двуликого');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CRYPT);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(true);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      seal: 'Восстанавливай в 2 раза больше здоровья',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытие', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  it('Разыгрывается', async () => {
    const healCard = new MockCard({ room });
    healCard.canPlayGeneralHandler = () => true;
    healCard.playGeneral = function () {
      this.owner?.heal(this.getHeal(2, this.owner));
      return Promise.resolve();
    };
    addCardToPlayerHand(healCard, activePlayer);

    await card.play();
    await healCard.play();

    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.seals.count).toBe(1);
    expect(activePlayer.seals.getCard(card)).toBe(card);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.health).toBe(24);
    expect(activePlayer.playedCards.array).toEqual([card, healCard]);
    expect(activePlayer.essenceToSpend).toBe(0);
  });

  it('Разыгрывается и применяется после других модификаторов', async () => {
    const healCard = new MockCard({ room });
    healCard.canPlayGeneralHandler = () => true;
    healCard.playGeneral = function () {
      this.owner?.heal(this.getHeal(2, this.owner));
      return Promise.resolve();
    };
    addCardToPlayerHand(healCard, activePlayer);
    activePlayer.modifiersHeal.addModifier(new HealModifier(uuidv4(), currentValue => currentValue + 5));
    activePlayer.health = 1;

    await card.play();
    await healCard.play();

    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.seals.count).toBe(1);
    expect(activePlayer.seals.getCard(card)).toBe(card);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.health).toBe(15);
    expect(activePlayer.playedCards.array).toEqual([card, healCard]);
    expect(activePlayer.essenceToSpend).toBe(0);
  });
});
