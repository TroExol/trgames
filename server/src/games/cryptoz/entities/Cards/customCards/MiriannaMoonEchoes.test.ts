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
} from '@/games/cryptoz/vitest/utils';

import { MiriannaMoonEchoes } from './MiriannaMoonEchoes';

describe('MiriannaMoonEchoes', () => {
  let card: MiriannaMoonEchoes;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    player = mocks.player;
    player.discardHand(player.hand);
    card = new MiriannaMoonEchoes(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new MiriannaMoonEchoes();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.MIRIANNA_MOON_ECHOES);
    expect(card.name).toBe('Мириана Лунные Эхо');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new MiriannaMoonEchoes(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.MIRIANNA_MOON_ECHOES);
    expect(card.name).toBe('Мириана Лунные Эхо');
    expect(card.target).toBe(CryptozShared.ECardTarget.ENEMY);
    expect(card.type).toBe(CryptozShared.ECardType.WICKEDNESS);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(1);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(true);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: '+1 эссенция. Ты и выбранный противник берете по карте',
      evade: 'Без эффекта',
    });
  });

  it('Нельзя разыграть мракобой', async () => {
    await card.playStrike();
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть печать', async () => {
    await card.playSeal();
    expect(card.canPlaySealHandler()).toBeFalsy();
  });

  it('Можно разыграть укрытие', async () => {
    expect(card.canPlayEvadeHandler()).toBeTruthy();
    await card.playEvade({ cardAttack: card });
  });

  it('Разыгрывается', async () => {
    vi.spyOn(room.socketService, 'selectTarget').mockResolvedValue(player);

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(activePlayer.hand.count).toBe(1);
    expect(player.hand.count).toBe(1);
  });

  it('Не разыгрывается без выбора цели', async () => {
    vi.spyOn(room.socketService, 'selectTarget').mockResolvedValue(null);

    void card.play();
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([card]);
    expect(activePlayer.hand.getCard(card)).toBeNull();
    expect(activePlayer.playedCards.array).toEqual([card]);
    expect(activePlayer.essenceToSpend).toBe(1);
    expect(activePlayer.hand.count).toBe(0);
    expect(player.hand.count).toBe(0);
  });

  it('Разыгрывается для хаоса', async () => {
    void card.play({ isForChaos: true });
    await vi.advanceTimersToNextTimerAsync();

    expect(activePlayer.arena.array).toEqual([]);
    expect(activePlayer.hand.getCard(card)).not.toBeNull();
    expect(activePlayer.playedCards.array).toEqual([]);
    expect(activePlayer.essenceToSpend).toBe(0);
    expect(activePlayer.hand.count).toBe(1);
    expect(player.hand.count).toBe(0);
  });
});
