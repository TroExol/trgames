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
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';

import { ForgottenQueens } from './ForgottenQueens';

describe('ForgottenQueens', () => {
  let card: ForgottenQueens;
  let room: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    card = new ForgottenQueens(room);
    addCardToPlayerHand(card, activePlayer);
  });

  it('Инстанс создается', () => {
    const card = new ForgottenQueens();
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.FORGOTTEN_QUEENS);
    expect(card.name).toBe('Забытые Королевы');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(true);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const card = new ForgottenQueens(room);
    expect(card).toBeDefined();
    expect(card.uuid).toBeDefined();
    expect(card.id).toBe(CryptozShared.ECardId.FORGOTTEN_QUEENS);
    expect(card.name).toBe('Забытые Королевы');
    expect(card.target).toBe(CryptozShared.ECardTarget.UNDEFINED);
    expect(card.type).toBe(CryptozShared.ECardType.ARTIFACT);
    expect(card.basePrice).toBe(3);
    expect(card.baseGloryShards).toBe(1);
    expect(card.baseEssence).toBe(0);
    expect(card.isSeal).toBe(true);
    expect(card.hasEvade).toBe(false);
    expect(card.logger).toBeInstanceOf(Logger);
    expect(card.room).toBe(room);
  });

  it('Описание корректное', () => {
    expect(card.format().description).toEqual({
      seal: 'В начале хода восстанавливай 1 здоровье за каждую печать на арене',
    });
  });

  it('Нельзя разыграть обычный розыгрыш', async () => {
    await card.play();
    expect(card.canPlayGeneralHandler()).toBeFalsy();
  });

  it('Нельзя разыграть мракобой', async () => {
    await card.playStrike();
    expect(card.canPlayStrikeHandler()).toBeFalsy();
  });

  it('Нельзя разыграть тотальный мракобой', async () => {
    await card.playTotalDarknessStrike();
    expect(card.canPlayTotalDarknessStrikeHandler()).toBeFalsy();
  });

  it('Можно разыграть как печать', () => {
    expect(card.canPlaySealHandler()).toBeTruthy();
  });

  it('Разыгрывается как печать и восстанавливает здоровье за печати', async () => {
    const sealCard1 = new MockCard({ room });
    const sealCard2 = new MockCard({ room });
    activePlayer.seals.addCardToTop(sealCard1);
    activePlayer.seals.addCardToTop(sealCard2);
    activePlayer.health = 15;

    await card.play();

    expect(activePlayer.health).toBe(15);

    await room.endTurn(player);

    expect(activePlayer.health).toBe(15);

    await room.endTurn(activePlayer);

    expect(activePlayer.health).toBe(15 + 3); // 15 + 3 (за 3 печати)
  });

  it('Не восстанавливает здоровье, если нет печатей', async () => {
    activePlayer.seals.clear();
    activePlayer.health = 15;

    await card.playSeal({ isForChaos: false });

    // Симулируем начало хода
    activePlayer.triggersOnTurnStarted.apply();

    expect(activePlayer.health).toBe(15); // здоровье не изменилось
  });

  it('Не работает в режиме хаоса', async () => {
    const result = await card.playSeal({ isForChaos: true });
    expect(result).toBeUndefined();
  });
});
