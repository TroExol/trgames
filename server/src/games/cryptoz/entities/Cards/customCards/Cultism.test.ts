import type { Socket } from 'socket.io';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { Logger } from '@/helpers/Logger';
import { addCardToPlayerHand, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { Cultism } from './Cultism';

describe('Cultism', () => {
  let card: Cultism;
  let room: Room;
  let activePlayer: Player;
  let player: Player;
  let player2: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    player2 = new Player({ nickname: 'player2', room, participant: 'player' });
    room.players.addPlayerToBottom(player2);
    const player2Socket = {
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      id: uuidv4(),
    } as unknown as Socket;
    room.socketService.sockets.addSocket(player2.nickname, player2Socket);
    player2.health = 20;
    card = new Cultism(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new Cultism();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CULTISM);
    expect(card.name).toBe('Культизм');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(7);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(3);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const mocks = createMockRoomWithPlayers();
    const room = mocks.room;
    const card = new Cultism(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.CULTISM);
    expect(card.name).toBe('Культизм');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(7);
    expect(card.baseGloryShards).toBe(2);
    expect(card.baseEssence).toBe(3);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+3 эссенции',
      strike: 'Нанеси 7 урона каждому противнику',
    });
  });

  it('Разыгрывается обычным способом', async () => {
    const initialEssence = activePlayer.essenceToSpend;
    await card.play({ canEvade: false });
    expect(activePlayer.essenceToSpend).toBe(initialEssence + 3);
    expect(activePlayer.playedCards.array).toEqual([card]);
  });

  it('Разыгрывается strike по всем противникам', async () => {
    activePlayer.arena.addCardToTop(card);
    await card.playStrike({ canEvade: false });
    expect(player.health).toBe(13);
    expect(player2.health).toBe(13);
  });

  it('Не наносится урон, если оба укрылись', async () => {
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);
    vi.spyOn(player2, 'tryEvade').mockResolvedValue(true);
    await card.playStrike();
    expect(player.health).toBe(20);
    expect(player2.health).toBe(20);
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть укрытие', async () => {
    await card.playEvade({ cardAttack: card });
    expect(card.canPlayEvadeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть печатью', async () => {
    await card.playSeal({ isForChaos: false });
    expect(card.canPlaySealHandler()).toBeFalsy();
  });
});
