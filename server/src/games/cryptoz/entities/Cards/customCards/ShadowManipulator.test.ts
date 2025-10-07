import type { Mock } from 'vitest';

import {
  beforeEach,
  describe,
  expect,
  vi,
} from 'vitest';
import { it } from 'vitest';
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
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { ShadowManipulator } from './ShadowManipulator';
import { Discharge } from './Discharge';

describe('ShadowManipulator', () => {
  let card: ShadowManipulator;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new ShadowManipulator(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new ShadowManipulator();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SHADOW_MANIPULATOR);
    expect(card.name).toBe('Манипулятор Теней');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.COMPANION);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new ShadowManipulator(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SHADOW_MANIPULATOR);
    expect(card.name).toBe('Манипулятор Теней');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.COMPANION);
    expect(card.basePrice).toBe(6);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции. Разыграй 1 хаос из 2-ух случайных из стопки уничтоженных хаосов, сам можешь не участвовать',
      evade: 'Возьми 1 карту и перенаправь мракобой в атакующего',
    });
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть мракобой', async () => {
    await card.playStrike();
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('Разыгрывается и играешь со всеми', async () => {
    const chaos = new MockCard({ room, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
    room.removed.chaos.clear();
    room.removed.chaos.addCardToTop(chaos);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [chaos]),
      variant: 1,
    });

    vi.spyOn(chaos, 'play').mockImplementation(vi.fn());

    await card.play();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
    expect(chaos.play).toHaveBeenCalledWith({ concreteTargets: room.players });
    expect(room.removed.chaos.getCard(chaos)).toBe(chaos);
  });

  it('Разыгрывается и не играешь', async () => {
    const chaos = new MockCard({ room, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
    room.removed.chaos.clear();
    room.removed.chaos.addCardToTop(chaos);

    room.socketService.selectCards = vi.fn().mockResolvedValue({
      cards: new CardGroup(ECardGroupType.ANY, [chaos]),
      variant: 2,
    });

    vi.spyOn(chaos, 'play').mockImplementation(vi.fn());

    await card.play();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
    expect((chaos.play as Mock).mock.calls[0][0].concreteTargets.nicknames)
      .toEqual(room.players.getPlayersExceptPlayer(activePlayer).nicknames);
    expect(room.removed.chaos.getCard(chaos)).toBe(chaos);
  });

  it('Разыгрывается при отсутствии хаосов', async () => {
    room.removed.chaos.clear();

    await card.play();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Разыгрывается укрытие', async () => {
    activePlayer.hand.clear();
    const cardAttack = new Discharge(room);
    addCardToPlayerHand(cardAttack, activePlayer);
    const cardEvade = new ShadowManipulator(room);
    addCardToPlayerHand(cardEvade, player);
    room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(cardEvade);
    await cardAttack.play({ concreteTarget: player });
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.hand.count).toBe(0);
    expect(activePlayer.playedCards.count).toBe(1);
    expect(activePlayer.essenceToSpend).toBe(1);

    expect(player.health).toBe(20);
    expect(player.hand.count).toBe(6);
    expect(player.hand.getCard(cardEvade)).toBeNull();
    expect(activePlayer.health).toBe(19);
  });

  it('Разыгрывается укрытие без атакующего', async () => {
    const cardAttack = new Discharge(room);
    const cardEvade = new ShadowManipulator(room);
    addCardToPlayerHand(cardEvade, player);
    room.socketService.selectEvadeCard = vi.fn().mockResolvedValue(cardEvade);
    await cardAttack.play({ tempPlayer: activePlayer, concreteTarget: player, isForChaos: true });
    expect(activePlayer.playedCards.count).toBe(0);

    expect(player.health).toBe(20);
    expect(player.hand.count).toBe(6);
    expect(player.hand.getCard(cardEvade)).toBeNull();
    expect(activePlayer.health).toBe(20);
  });
});
