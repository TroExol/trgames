import type { Mock } from 'vitest';
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
import {
  addCardToPlayerHand,
  createMockRoom,
  createMockRoomWithPlayers,
} from '@/games/cryptoz/vitest/utils';
import { EStoneShardGroupType, StoneShardGroup } from '@/games/cryptoz/entities/StoneShards/StoneShardGroup';
import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';
import { Player } from '@/games/cryptoz/entities/Players/Player';

import { SoulPunisher } from './SoulPunisher';

describe('SoulPunisher', () => {
  let card: SoulPunisher;
  let room: Room;
  let activePlayer: Player;
  let player: Player;
  let playerMinHp: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;

    playerMinHp = new Player({ nickname: 'playerMinHp', room, participant: 'player' });
    room.players.addPlayerToBottom(playerMinHp);
    const playerMinHpSocket = {
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      id: uuidv4(),
    } as unknown as Socket;
    room.socketService.sockets.addSocket(playerMinHp.nickname, playerMinHpSocket);
    playerMinHp.health = 10;

    card = new SoulPunisher(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new SoulPunisher();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SOUL_PUNISHER);
    expect(card.name).toBe('Каратель душ');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(2);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new SoulPunisher(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.SOUL_PUNISHER);
    expect(card.name).toBe('Каратель душ');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.CREATURE);
    expect(card.basePrice).toBe(3);
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
      strike: 'Нанеси 4 урона противнику с наименьшим здоровьем. Если этот противник погибает, выбери ему 1 из 2 осколков Философского камня',
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

  it('Разыгрывается без убийства', async () => {
    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(20);
    expect(playerMinHp.health).toBe(6);
    expect(activePlayer.hand.count).toBe(0);
  });

  it('Разыгрывается и убивает', async () => {
    const stoneShard1 = new StoneShard1(room);
    const stoneShard2 = new StoneShard1(room);
    room.stoneShards.clear();
    room.stoneShards.addStoneShardToBottom(stoneShard1);
    room.stoneShards.addStoneShardToBottom(stoneShard2);

    room.socketService.selectStoneShards = vi.fn().mockResolvedValue({
      stoneShards: new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard2]),
    });

    playerMinHp.health = 4;

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(player.health).toBe(20);
    expect(playerMinHp.health).toBe(20);
    expect(playerMinHp.stoneShards.count).toBe(1);
    expect(playerMinHp.stoneShards.getStoneShard(stoneShard2)).toBe(stoneShard2);
    expect(room.stoneShards.count).toBe(1);
    expect(room.stoneShards.getStoneShard(stoneShard1)).toBe(stoneShard1);
    expect(activePlayer.hand.count).toBe(0);
    const selectStoneShard = (room.socketService.selectStoneShards as Mock).mock.calls[0];
    expect(selectStoneShard).toBeDefined();
    expect(selectStoneShard?.[0].player).toBe(activePlayer);
    expect(selectStoneShard?.[0].variants).toEqual([{ id: 1, value: 'Выбрать' }]);
    expect(selectStoneShard?.[0].title).toBe(`Выбери 1 осколок Философского камня для участника ${playerMinHp.nickname}`);
  });

  it('Не наносится урон, если укрылся', async () => {
    vi.spyOn(player, 'tryEvade').mockResolvedValue(true);

    void card.play({ concreteTarget: player });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(2);
    expect(activePlayer.health).toBe(20);
    expect(activePlayer.hand.count).toBe(0);
  });
});
