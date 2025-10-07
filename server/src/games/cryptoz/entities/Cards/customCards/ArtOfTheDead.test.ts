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
import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';

import { GreatSkeleton } from './GreatSkeleton';
import { ArtOfTheDead } from './ArtOfTheDead';

describe('ArtOfTheDead', () => {
  let card: ArtOfTheDead;
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
    card = new ArtOfTheDead(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    expect(card).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.ART_OF_THE_DEAD);
    expect(card.name).toBe('Искусство Мертвецов');
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
      strike: 'Разыграй, если у тебя на арене есть Великий Костяк: выбери осколок Философского камня противника и поменяйся с ним осколками, затем разыграй эффекты этих осколков',
    });
  });

  it('Разыгрывает general: +3 эссенции', async () => {
    activePlayer.arena.addCardToTop(card);
    await card.playGeneral();
    expect(activePlayer.essenceToSpend).toBe(3);
  });

  it('Не разыгрывает strike без Великого Костяка', async () => {
    activePlayer.arena.addCardToTop(card);
    const result = await card.playStrike({ concreteTarget: enemyPlayer });
    expect(result).toBeUndefined();
  });

  it('Разыгрывает strike с Великим Костяком и меняет осколки', async () => {
    // Добавляем по осколку каждому
    const playerShard = new StoneShard1(room);
    const enemyShard = new StoneShard1(room);
    activePlayer.stoneShards.addStoneShardToTop(playerShard);
    enemyPlayer.stoneShards.addStoneShardToTop(enemyShard);

    // Мокаем selectTarget и selectStoneShards
    room.socketService.selectTarget = vi.fn().mockResolvedValue(enemyPlayer);
    room.socketService.selectStoneShards = vi.fn()
      .mockResolvedValueOnce({ stoneShards: { array: [enemyShard] } })
      .mockResolvedValueOnce({ stoneShards: { array: [playerShard] } });

    // Добавляем Великого Костяка в печати
    const skeleton = new GreatSkeleton(room);
    activePlayer.seals.addCardToTop(skeleton);
    activePlayer.arena.addCardToTop(card);
    await card.playStrike({ canEvade: false });
    expect(activePlayer.stoneShards.array[0]).toBe(enemyShard);
    expect(enemyPlayer.stoneShards.array[0]).toBe(playerShard);
  });

  it('Не происходит обмена, если цель укрылась', async () => {
    // Добавляем по осколку каждому
    const playerShard = new StoneShard1(room);
    const enemyShard = new StoneShard1(room);
    activePlayer.stoneShards.addStoneShardToTop(playerShard);
    enemyPlayer.stoneShards.addStoneShardToTop(enemyShard);

    // Мокаем selectTarget и selectStoneShards
    room.socketService.selectTarget = vi.fn().mockResolvedValue(enemyPlayer);
    room.socketService.selectStoneShards = vi.fn()
      .mockResolvedValueOnce({ stoneShards: { array: [enemyShard] } })
      .mockResolvedValueOnce({ stoneShards: { array: [playerShard] } });

    // Мокаем уклонение
    vi.spyOn(enemyPlayer, 'tryEvade').mockResolvedValue(true);

    // Добавляем Великого Костяка в печати
    const skeleton = new GreatSkeleton(room);
    activePlayer.seals.addCardToTop(skeleton);
    activePlayer.arena.addCardToTop(card);
    await card.playStrike({ canEvade: true });
    // Осколки не поменялись
    expect(activePlayer.stoneShards.array[0]).toBe(playerShard);
    expect(enemyPlayer.stoneShards.array[0]).toBe(enemyShard);
  });

  it('Происходит обмен, если цель не укрылась', async () => {
    // Добавляем по осколку каждому
    const playerShard = new StoneShard1(room);
    const enemyShard = new StoneShard1(room);
    activePlayer.stoneShards.addStoneShardToTop(playerShard);
    enemyPlayer.stoneShards.addStoneShardToTop(enemyShard);

    // Мокаем selectTarget и selectStoneShards
    room.socketService.selectTarget = vi.fn().mockResolvedValue(enemyPlayer);
    room.socketService.selectStoneShards = vi.fn()
      .mockResolvedValueOnce({ stoneShards: { array: [enemyShard] } })
      .mockResolvedValueOnce({ stoneShards: { array: [playerShard] } });

    // Мокаем уклонение
    vi.spyOn(enemyPlayer, 'tryEvade').mockResolvedValue(false);

    // Добавляем Великого Костяка в печати
    const skeleton = new GreatSkeleton(room);
    activePlayer.seals.addCardToTop(skeleton);
    activePlayer.arena.addCardToTop(card);
    await card.playStrike({ canEvade: true });
    // Осколки поменялись
    expect(activePlayer.stoneShards.array[0]).toBe(enemyShard);
    expect(enemyPlayer.stoneShards.array[0]).toBe(playerShard);
  });
});
