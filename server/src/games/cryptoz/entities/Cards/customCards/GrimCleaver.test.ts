import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { Logger } from '@/helpers/Logger';
import {
  addCardToPlayerHand,
  addPlayerToRoom,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { GrimCleaver } from './GrimCleaver';

describe('GrimCleaver', () => {
  let card: GrimCleaver;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    card = new GrimCleaver(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new GrimCleaver();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.GRIM_CLEAVER);
    expect(card.name).toBe('Мрачный Секач');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new GrimCleaver(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.GRIM_CLEAVER);
    expect(card.name).toBe('Мрачный Секач');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+2 эссенции',
      strike: 'Нанеси 5 урона противникам слева и справа',
    });
  });

  it('Разыгрывается обычным способом', async () => {
    const initialEssence = activePlayer.essenceToSpend;

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
    expect(player.health).toBe(15);
    expect(activePlayer.health).toBe(20);
  });

  it('Разыгрывается мракобой - атакует участников слева и справа', async () => {
    const otherPlayer = new Player({
      room,
      nickname: 'otherPlayer',
      participant: 'player',
    });
    addPlayerToRoom(otherPlayer, room);

    void card.play();
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.arena.count).toBe(1);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(activePlayer.health).toBe(20);

    // Проверяем что урон нанесен участникам слева и справа
    const leftPlayer = room.players.getLeftPlayer(activePlayer)!;
    const rightPlayer = room.players.getRightPlayer(activePlayer)!;

    expect(leftPlayer.health).toBe(15);
    expect(rightPlayer.health).toBe(15);
  });

  it('Не наносится урон, если укрылся', async () => {
    const otherPlayer = new Player({
      room,
      nickname: 'otherPlayer',
      participant: 'player',
    });
    addPlayerToRoom(otherPlayer, room);

    const leftPlayer = room.players.getLeftPlayer(activePlayer)!;
    const rightPlayer = room.players.getRightPlayer(activePlayer)!;

    if (leftPlayer) {
      vi.spyOn(leftPlayer, 'tryEvade').mockResolvedValue(true);
    }
    if (rightPlayer && leftPlayer && !rightPlayer.theSame(leftPlayer)) {
      vi.spyOn(rightPlayer, 'tryEvade').mockResolvedValue(true);
    }

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(activePlayer.health).toBe(20);

    // Проверяем что урон не нанесен из-за укрытия
    expect(leftPlayer.health).toBe(20);
    expect(rightPlayer.health).toBe(20);
  });

  it('Нельзя разыграть укрытием', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть тотальным мракобоем', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть печатью', async () => {
    await card.playSeal({ isForChaos: false });
    expect(card.canPlaySealHandler()).toBeFalsy();
  });
});
