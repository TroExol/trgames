import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { Logger } from '@/helpers/Logger';
import {
  addCardToPlayerHand,
  addStoneShardToPlayer,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';
import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';

import { GreatSkeleton } from './GreatSkeleton';

describe('GreatSkeleton', () => {
  let card: GreatSkeleton;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new GreatSkeleton(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new GreatSkeleton();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.GREAT_SKELETON);
    expect(card.name).toBe('Великий Костяк');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(0);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(true);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new GreatSkeleton(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.GREAT_SKELETON);
    expect(card.name).toBe('Великий Костяк');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(0);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(true);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      seal: 'Считай, что у тебя на 1 осколок Философского камня больше',
      other: 'Эта карта приносит 1 осколок славы за каждый твой настоящий осколок Философского камня',
    });
  });

  it('Нельзя разыграть обычным способом', async () => {
    await card.play();
    expect(card.canPlayGeneralHandler()).toBeFalsy();
  });

  it('Можно разыграть печатью', async () => {
    expect(card.canPlaySealHandler()).toBeTruthy();

    // Добавляем карточку в печати участника
    activePlayer.seals.addCardToTop(card);

    await card.playSeal({ isForChaos: false });
    expect(activePlayer.countStoneShards).toBe(1);
  });

  it('Нельзя разыграть мракобоем', async () => {
    await card.playStrike();
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть тотальным мракобоем', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытием', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  it('Добавляет +1 к количеству осколков философского камня при активации печати', async () => {
    expect(activePlayer.countStoneShards).toBe(0);

    // Добавляем карточку в печати участника
    activePlayer.seals.addCardToTop(card);

    await card.playSeal({ isForChaos: false });

    expect(activePlayer.countStoneShards).toBe(1);
  });

  it('Убирает модификатор при сбросе карты', async () => {
    // Добавляем карточку в печати участника
    activePlayer.seals.addCardToTop(card);

    await card.playSeal({ isForChaos: false });
    expect(activePlayer.countStoneShards).toBe(1);

    activePlayer.discardSeal(activePlayer.seals);

    expect(activePlayer.countStoneShards).toBe(0);
  });

  it('Убирает модификатор при смене владельца', async () => {
    // Добавляем карточку в печати участника
    activePlayer.seals.addCardToTop(card);

    await card.playSeal({ isForChaos: false });
    expect(activePlayer.countStoneShards).toBe(1);

    card.changeOwner('player2');

    expect(activePlayer.countStoneShards).toBe(0);
  });

  it('Возвращает осколки славы в зависимости от количества осколков философского камня', () => {
    // Изначально 0 осколков философского камня
    expect(card.getGloryShards()).toBe(0);

    // Добавляем осколок философского камня участнику
    const stoneShard = new StoneShard1(room);
    addStoneShardToPlayer(stoneShard, activePlayer);

    // Теперь должно быть 1 осколок философского камня
    expect(activePlayer.stoneShards.count).toBe(1);
    expect(card.getGloryShards()).toBe(1);

    // Добавляем еще один осколок
    const stoneShard2 = new StoneShard1(room);
    addStoneShardToPlayer(stoneShard2, activePlayer);

    // Теперь должно быть 2 осколка философского камня
    expect(activePlayer.stoneShards.count).toBe(2);
    expect(card.getGloryShards()).toBe(2);
  });

  it('Возвращает 0 осколков славы если нет владельца', () => {
    expect(card.getGloryShards()).toBe(0);
  });
});
