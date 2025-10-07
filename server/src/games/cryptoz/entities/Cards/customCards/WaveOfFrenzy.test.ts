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

import { WaveOfFrenzy } from './WaveOfFrenzy';
import { StoneShard1 } from '../../StoneShards/customStoneShards/StoneShard1';

describe('WaveOfFrenzy', () => {
  let card: WaveOfFrenzy;
  let room: Room;
  let activePlayer: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    activePlayer.discardHand(activePlayer.hand);
    card = new WaveOfFrenzy(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new WaveOfFrenzy();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.WAVE_OF_FRENZY);
    expect(card.name).toBe('Волна Исступления');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new WaveOfFrenzy(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.WAVE_OF_FRENZY);
    expect(card.name).toBe('Волна Исступления');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.RITUAL);
    expect(card.basePrice).toBe(5);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(false);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      general: 'Если у тебя есть 3 или более осколков Философского камня, возьми 3 карты. Иначе получи +2 эссенции',
    });
  });

  it('Разыгрывается обычным способом когда осколков Философского камня меньше 3', async () => {
    const initialEssence = activePlayer.essenceToSpend;
    await card.play();

    expect(activePlayer.essenceToSpend).toBe(initialEssence + 2);
    expect(activePlayer.playedCards.array).toEqual([card]);
  });

  it('Разыгрывается обычным способом когда осколков Философского камня 3 или больше', async () => {
    addStoneShardToPlayer(new StoneShard1(room), activePlayer);
    addStoneShardToPlayer(new StoneShard1(room), activePlayer);
    addStoneShardToPlayer(new StoneShard1(room), activePlayer);

    await card.play();

    expect(activePlayer.hand.count).toBe(3);
    expect(activePlayer.playedCards.array).toEqual([card]);
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

  it('Нельзя разыграть печатью', async () => {
    await card.playSeal({ isForChaos: false });
    expect(card.canPlaySealHandler()).toBeFalsy();
  });
});
