import type { Namespace } from 'socket.io';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import _ from 'lodash';
import { CryptozShared } from '@trgames/shared';

import { Logger } from '@/helpers/Logger';
import {
  addPlayerToRoom,
  createMockRoom,
  createMockRoomWithPlayers,
  MockCard,
} from '@/games/cryptoz/vitest/utils';
import { SocketsService } from '@/games/cryptoz/services/SocketsService';
import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';
import { Player } from '@/games/cryptoz/entities/Players/Player';
import { LogGroup } from '@/games/cryptoz/entities/Logs/LogGroup';
import { DarknessCrown } from '@/games/cryptoz/entities/DarknessCrown';
import { SoulfireAltar } from '@/games/cryptoz/entities/Cards/customCards/SoulfireAltar';
import { Oblivion } from '@/games/cryptoz/entities/Cards/customCards/Oblivion';
import { DreadOneEyedWarrior } from '@/games/cryptoz/entities/Cards/customCards/DreadOneEyedWarrior';
import { Ability2 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability2';

import { Room } from './index';

describe('Room', () => {
  let room: Room;
  let mockedRoom: Room;
  let activePlayer: Player;
  let player: Player;

  beforeEach(() => {
    room = new Room({
      uuid: '1',
      name: 'Тестовая комната',
      nsp: {} as Namespace,
      settings: {
        maxPlayers: 5,
        maxMarket: 5,
        password: 'password',
      },
    });
    const mocked = createMockRoomWithPlayers();
    mockedRoom = mocked.room;
    activePlayer = mocked.activePlayer;
    player = mocked.player;
  });

  it('Инстанс создается', () => {
    expect(room).toBeInstanceOf(Room);
    expect(room).toBeDefined();
    expect(room.name).toBe('Тестовая комната');
    expect(room.players.count).toBe(0);
    expect(room.stoneShards.count).toBe(20);
    expect(room.abilities.count).toBe(8);
    expect(room.companions.count).toBe(12);
    expect(room.removed.cards.count).toBe(0);
    expect(room.removed.chaos.count).toBe(0);
    expect(room.deck.count).toBe(124 - 5); // - 5 карты, которые уходят на рынок
    expect(room.market.count).toBe(5);
    expect(room.harbingers.count).toBe(12);
    expect(room.settings.password).toBe('password');
    expect(room.cursedSeals.count).toBe(16);
    expect(room.darknessMadness.count).toBe(16);
    expect(room.darknessCrown).toBeInstanceOf(DarknessCrown);
    expect(room.logs).toBeInstanceOf(LogGroup);
    expect(room.socketService).toBeInstanceOf(SocketsService);
    expect(room.settings.maxPlayers).toBe(5);
    expect(room.settings.maxMarket).toBe(5);
    expect(room.activeChaos).toBeUndefined();
    expect(room.activePlayerNickname).toBeUndefined();
    expect(room.adminNickname).toBeUndefined();
    expect(room.isGameStarted).toBeFalsy();
    expect(room.isGameEnded).toBeFalsy();
    expect(room.logger).toBeInstanceOf(Logger);
  });

  describe('endTurn', () => {
    it('Не завершает ход, если игра окончена', async () => {
      mockedRoom.isGameEnded = true;
      const initialActivePlayer = mockedRoom.activePlayer;

      await mockedRoom.endTurn(player);

      expect(mockedRoom.activePlayer).toBe(initialActivePlayer);
    });

    it('Не завершает ход, если игра не началась', async () => {
      mockedRoom.isGameStarted = false;
      const initialActivePlayer = mockedRoom.activePlayer;

      await mockedRoom.endTurn(player);

      expect(mockedRoom.activePlayer).toBe(initialActivePlayer);
    });

    it('Не завершает ход, если новый участник уже активен', async () => {
      mockedRoom.activePlayerNickname = player.nickname;
      const initialActivePlayer = mockedRoom.activePlayer;

      await mockedRoom.endTurn(player);

      expect(mockedRoom.activePlayer).toBe(initialActivePlayer);
    });

    it('Не завершает ход, если есть ожидающие подтверждения', async () => {
      mockedRoom.socketService.addPendingAck('test', activePlayer);
      const initialActivePlayer = mockedRoom.activePlayer;

      await mockedRoom.endTurn(player);

      expect(mockedRoom.activePlayer).toBe(initialActivePlayer);
    });

    it('Завершает ход принудительно, даже если есть ограничения', async () => {
      mockedRoom.isGameEnded = true;
      mockedRoom.socketService.addPendingAck('test', activePlayer);

      await mockedRoom.endTurn(player, true);

      expect(mockedRoom.activePlayer).toBe(player);
    });

    it('Завершает игру, если недостаточно карт для заполнения рынка', async () => {
      mockedRoom.market.array.pop();
      mockedRoom.deck.clear();
      mockedRoom.socketService.emitToPlayers = vi.fn();

      await mockedRoom.endTurn(player);

      expect(mockedRoom.isGameEnded).toBeTruthy();
    });

    it('Завершает игру, если нет предвестников', async () => {
      mockedRoom.harbingers.clear();
      mockedRoom.socketService.emitToPlayers = vi.fn();

      await mockedRoom.endTurn(player);

      expect(mockedRoom.isGameEnded).toBeTruthy();
    });

    it('Завершает игру, если нет осколков философского камня', async () => {
      mockedRoom.stoneShards.clear();
      mockedRoom.socketService.emitToPlayers = vi.fn();

      await mockedRoom.endTurn(player);

      expect(mockedRoom.isGameEnded).toBeTruthy();
    });

    it('Корректно завершает ход активного участника', async () => {
      const card = new SoulfireAltar(mockedRoom);
      const arenaCard = new Oblivion(mockedRoom);
      activePlayer.hand.addCardToBottom(card);
      activePlayer.arena.addCardToBottom(arenaCard);
      mockedRoom.socketService.emitToPlayers = vi.fn();

      await mockedRoom.endTurn(player);

      expect(activePlayer.hand.count).toBe(5);
      expect(activePlayer.arena.count).toBe(0);
      expect(activePlayer.discard.count).toBe(7);
      expect(mockedRoom.activePlayer).toBe(player);
    });

    it('Применяет триггеры окончания хода', async () => {
      activePlayer.triggersOnTurnEnded.apply = vi.fn();

      await mockedRoom.endTurn(player);

      expect(activePlayer.triggersOnTurnEnded.apply).toHaveBeenCalledTimes(1);
    });

    it('Заполняет руку после окончания хода', async () => {
      activePlayer.fillHand = vi.fn();

      await mockedRoom.endTurn(player);

      expect(activePlayer.fillHand).toHaveBeenCalledTimes(1);
    });

    it('Применяет триггеры заполнения руки', async () => {
      activePlayer.triggersOnHandFilledOnTurnEnd.apply = vi.fn();

      await mockedRoom.endTurn(player);

      expect(activePlayer.triggersOnHandFilledOnTurnEnd.apply).toHaveBeenCalledTimes(1);
    });

    it('Играет корону Мрака', async () => {
      mockedRoom.darknessCrown.play = vi.fn().mockResolvedValue(undefined);

      await mockedRoom.endTurn(player);

      expect(mockedRoom.darknessCrown.play).toHaveBeenCalledTimes(1);
    });

    it('Добавляет лог о завершении хода', async () => {
      mockedRoom.socketService.emitToPlayers = vi.fn();

      await mockedRoom.endTurn(player);

      expect(mockedRoom.logs.array[0].format().message).toBe(`Участник ${activePlayer.nickname} закончил ход`);
    });

    it('Играет тотальный мракобой, если активный участник купил предвестника', async () => {
      const harbinger = new DreadOneEyedWarrior(mockedRoom);
      activePlayer.boughtCards.addCardToBottom(harbinger);
      const emitSpy = vi.spyOn(mockedRoom.socketService, 'emitToPlayers');
      const topHarbinger = mockedRoom.harbingers.top;
      if (topHarbinger) {
        topHarbinger.playTotalDarknessStrike = vi.fn().mockResolvedValue(undefined);
      }

      await mockedRoom.endTurn(player);

      if (topHarbinger) {
        expect(topHarbinger.playTotalDarknessStrike).toHaveBeenCalledTimes(1);
        const modalCall = emitSpy.mock.calls.find(([, event]) => event === CryptozShared.EEventTypes.showModalCards);
        expect(modalCall).toBeDefined();
        if (modalCall) {
          expect(modalCall[2]).toMatchObject({
            title: 'Разыгрывается тотальный мракобой',
            cards: [expect.objectContaining({ uuid: topHarbinger.uuid })],
          });
        }
      }
    });

    it('Устанавливает нового активного участника', async () => {
      await mockedRoom.endTurn(player);

      expect(mockedRoom.activePlayerNickname).toBe(player.nickname);
      expect(mockedRoom.activePlayer).toBe(player);
    });

    it('Добавляет лог о начале хода', async () => {
      mockedRoom.socketService.emitToPlayers = vi.fn();

      await mockedRoom.endTurn(player);

      expect(mockedRoom.logs.count).toBe(2);
      expect(mockedRoom.logs.array[1].format().message).toBe(`Участник ${player.nickname} начал ход`);
    });

    it('Сбрасывает атрибуты всех участников', async () => {
      activePlayer.resetAttributes = vi.fn();
      player.resetAttributes = vi.fn();

      await mockedRoom.endTurn(player);

      expect(activePlayer.resetAttributes).toHaveBeenCalledTimes(1);
      expect(player.resetAttributes).toHaveBeenCalledTimes(1);
    });

    it('Сбрасывает атрибуты короны Мрака', async () => {
      mockedRoom.darknessCrown.resetAttributes = vi.fn();

      await mockedRoom.endTurn(player);

      expect(mockedRoom.darknessCrown.resetAttributes).toHaveBeenCalledTimes(1);
    });

    it('Заполняет рынок', async () => {
      mockedRoom.fillMarket = vi.fn().mockResolvedValue(undefined);

      await mockedRoom.endTurn(player);

      expect(mockedRoom.fillMarket).toHaveBeenCalledTimes(1);
    });

    it('Применяет триггеры начала хода', async () => {
      player.triggersOnTurnStarted.apply = vi.fn();

      await mockedRoom.endTurn(player);

      expect(player.triggersOnTurnStarted.apply).toHaveBeenCalledTimes(1);
    });
  });

  it('Админ меняется', () => {
    expect(mockedRoom.adminPlayer).toBe(activePlayer);
    mockedRoom.changeAdmin(player);
    expect(mockedRoom.adminPlayer).toBe(player);
  });

  describe('joinPlayer', () => {
    it('Новый участник подключается, если максимальное кол-во участников >= 5', async () => {
      mockedRoom.isGameStarted = false;
      mockedRoom.companions.clear();
      mockedRoom.abilities.clear();
      const companion1 = new Oblivion(mockedRoom);
      const companion2 = new Oblivion(mockedRoom);
      mockedRoom.companions.addCardToBottom(companion1);
      mockedRoom.companions.addCardToBottom(companion2);
      const ability1 = new Ability2(mockedRoom);
      const ability2 = new Ability2(mockedRoom);
      mockedRoom.abilities.addAbilityToBottom(ability1);
      mockedRoom.abilities.addAbilityToBottom(ability2);

      await mockedRoom.joinPlayer('Новый участник');

      expect(mockedRoom.viewers.count).toBe(0);
      expect(mockedRoom.players.count).toBe(3);
      const newPlayer = mockedRoom.players.getPlayerByNickname('Новый участник')!;
      expect(newPlayer).toBeDefined();
      expect(newPlayer.companion).toBeDefined();
      expect(newPlayer.abilities.count).toBe(1);
      expect(mockedRoom.companions.count).toBe(1);
      expect(mockedRoom.abilities.count).toBe(1);
    });

    it('Новый участник подключается, если максимальное кол-во участников < 5', async () => {
      mockedRoom.isGameStarted = false;
      mockedRoom.settings.maxPlayers = 4;
      mockedRoom.companions.clear();
      mockedRoom.abilities.clear();
      const companion1 = new Oblivion(mockedRoom);
      const companion2 = new Oblivion(mockedRoom);
      mockedRoom.companions.addCardToBottom(companion1);
      mockedRoom.companions.addCardToBottom(companion2);
      const ability1 = new Ability2(mockedRoom);
      const ability2 = new Ability2(mockedRoom);
      mockedRoom.abilities.addAbilityToBottom(ability1);
      mockedRoom.abilities.addAbilityToBottom(ability2);
      mockedRoom.socketService.selectAbilityAndCompanion = vi.fn().mockResolvedValue({
        companion: companion1,
        ability: ability1,
      });

      await mockedRoom.joinPlayer('Новый участник');

      expect(mockedRoom.viewers.count).toBe(0);
      expect(mockedRoom.players.count).toBe(3);
      const newPlayer = mockedRoom.players.getPlayerByNickname('Новый участник')!;
      expect(newPlayer).toBeDefined();
      expect(newPlayer.companion).toBe(companion1);
      expect(newPlayer.abilities.count).toBe(1);
      expect(newPlayer.abilities.getAbility(ability1)).toBe(ability1);
      expect(mockedRoom.companions.count).toBe(1);
      expect(mockedRoom.companions.getCard(companion2)).toBe(companion2);
      expect(mockedRoom.abilities.count).toBe(1);
      expect(mockedRoom.abilities.getAbility(ability2)).toBe(ability2);
    });

    it('Существующий участник подключается в не начатой игре со способностью и помощником', async () => {
      mockedRoom.isGameStarted = false;
      mockedRoom.companions.clear();
      mockedRoom.abilities.clear();
      const companion1 = new Oblivion(mockedRoom);
      const companion2 = new Oblivion(mockedRoom);
      activePlayer.companion = companion1;
      mockedRoom.companions.addCardToBottom(companion2);
      const ability1 = new Ability2(mockedRoom);
      const ability2 = new Ability2(mockedRoom);
      activePlayer.abilities.addAbilityToBottom(ability1);
      mockedRoom.abilities.addAbilityToBottom(ability2);

      await mockedRoom.joinPlayer(activePlayer.nickname);

      expect(mockedRoom.viewers.count).toBe(0);
      expect(mockedRoom.players.count).toBe(2);
      expect(activePlayer.companion).toBeDefined();
      expect(activePlayer.abilities.count).toBe(1);
      expect(mockedRoom.companions.count).toBe(1);
      expect(mockedRoom.abilities.count).toBe(1);
    });

    it('Подключается наблюдатель', () => {
      mockedRoom.joinViewer('Новый участник');

      expect(mockedRoom.players.count).toBe(2);
      expect(mockedRoom.viewers.count).toBe(1);
    });
  });

  describe('removePlayer', () => {
    it('Удаляется участник', () => {
      mockedRoom.socketService.disconnect = vi.fn();
      mockedRoom.socketService.addPendingAck('ack', player);

      mockedRoom.removePlayer(player);

      expect(mockedRoom.players.count).toBe(1);
      expect(mockedRoom.socketService.pendingAckNicknames.length).toBe(0);
      expect(mockedRoom.socketService.disconnect).toHaveBeenCalledTimes(1);
      expect(mockedRoom.socketService.disconnect).toHaveBeenCalledWith(player);
    });

    it('Удаляется участник с короной Мрака', () => {
      mockedRoom.darknessCrown.changeOwner(player.nickname);

      mockedRoom.removePlayer(player);

      expect(mockedRoom.players.count).toBe(1);
      expect(mockedRoom.darknessCrown.owner).toBeNull();
    });

    it('Удаляется активный участник', () => {
      mockedRoom.socketService.disconnect = vi.fn();
      mockedRoom.socketService.addPendingAck('ack', activePlayer);

      mockedRoom.removePlayer(activePlayer);

      expect(mockedRoom.activePlayer).toBe(player);
      expect(mockedRoom.adminPlayer).toBe(player);
      expect(mockedRoom.players.count).toBe(1);
      expect(mockedRoom.socketService.pendingAckNicknames.length).toBe(0);
      expect(mockedRoom.socketService.disconnect).toHaveBeenCalledTimes(1);
      expect(mockedRoom.socketService.disconnect).toHaveBeenCalledWith(activePlayer);
    });
  });

  describe('endGame', () => {
    it('Игра завершается', () => {
      const card = new SoulfireAltar(mockedRoom);
      player.deck.addCardToBottom(card);
      const emitToPlayers = vi.fn();
      mockedRoom.socketService.emitToPlayers = emitToPlayers;

      mockedRoom.endGame();

      expect(mockedRoom.isGameEnded).toBeTruthy();
      expect(activePlayer.discard.count).toBe(10);
      expect(activePlayer.hand.count).toBe(0);
      expect(activePlayer.deck.count).toBe(0);
      expect(player.discard.count).toBe(11);
      expect(player.hand.count).toBe(0);
      expect(player.deck.count).toBe(0);
      expect(emitToPlayers).toHaveBeenCalledTimes(3);
      expect(_.map(emitToPlayers.mock.calls[0][2].players as CryptozShared.TPlayer[], 'nickname')).toEqual(['Участник', 'Активный участник']);
      expect(_.last((emitToPlayers.mock.calls[1][2] as CryptozShared.TLog[]))!.message).toBe('Игра окончена. Победил участник Участник');
    });

    it('Игра завершается при равном кол-ве осколков величия, предвестников и осколков Философского камня', () => {
      const emitToPlayers = vi.fn();
      mockedRoom.socketService.emitToPlayers = emitToPlayers;

      mockedRoom.endGame();

      expect(mockedRoom.isGameEnded).toBeTruthy();
      expect(activePlayer.discard.count).toBe(10);
      expect(activePlayer.hand.count).toBe(0);
      expect(activePlayer.deck.count).toBe(0);
      expect(player.discard.count).toBe(10);
      expect(player.hand.count).toBe(0);
      expect(player.deck.count).toBe(0);
      expect(emitToPlayers).toHaveBeenCalledTimes(3);
      expect(_.map(emitToPlayers.mock.calls[0][2].players as CryptozShared.TPlayer[], 'nickname')).toEqual(['Активный участник', 'Участник']);
      expect(_.last((emitToPlayers.mock.calls[1][2] as CryptozShared.TLog[]))!.message).toBe('Игра окончена. Победил участник Активный участник');
    });

    it('Игра завершается при равном кол-ве осколков величия, предвестников и разном кол-ве осколков Философского камня', () => {
      const stoneShard = new StoneShard1(mockedRoom);
      activePlayer.stoneShards.addStoneShardToBottom(stoneShard);
      const emitToPlayers = vi.fn();
      mockedRoom.socketService.emitToPlayers = emitToPlayers;

      mockedRoom.endGame();

      expect(mockedRoom.isGameEnded).toBeTruthy();
      expect(activePlayer.stoneShards.count).toBe(1);
      expect(activePlayer.discard.count).toBe(10);
      expect(activePlayer.hand.count).toBe(0);
      expect(activePlayer.deck.count).toBe(0);
      expect(player.stoneShards.count).toBe(0);
      expect(player.discard.count).toBe(10);
      expect(player.hand.count).toBe(0);
      expect(player.deck.count).toBe(0);
      expect(emitToPlayers).toHaveBeenCalledTimes(3);
      expect(_.map(emitToPlayers.mock.calls[0][2].players as CryptozShared.TPlayer[], 'nickname')).toEqual(['Участник', 'Активный участник']);
      expect(_.last((emitToPlayers.mock.calls[1][2] as CryptozShared.TLog[]))!.message).toBe('Игра окончена. Победил участник Участник');
    });

    it('Игра завершается при равном кол-ве осколков величия и разном предвестников', () => {
      const harbinger = new DreadOneEyedWarrior(mockedRoom);
      player.discard.addCardToBottom(harbinger);
      const emitToPlayers = vi.fn();
      mockedRoom.socketService.emitToPlayers = emitToPlayers;

      mockedRoom.endGame();

      expect(mockedRoom.isGameEnded).toBeTruthy();
      expect(activePlayer.stoneShards.count).toBe(0);
      expect(activePlayer.discard.count).toBe(10);
      expect(activePlayer.hand.count).toBe(0);
      expect(activePlayer.deck.count).toBe(0);
      expect(player.stoneShards.count).toBe(0);
      expect(player.discard.count).toBe(11);
      expect(player.hand.count).toBe(0);
      expect(player.deck.count).toBe(0);
      expect(emitToPlayers).toHaveBeenCalledTimes(3);
      expect(_.map(emitToPlayers.mock.calls[0][2].players as CryptozShared.TPlayer[], 'nickname')).toEqual(['Участник', 'Активный участник']);
      expect(_.last((emitToPlayers.mock.calls[1][2] as CryptozShared.TLog[]))!.message).toBe('Игра окончена. Победил участник Участник');
    });
  });

  describe('fillMarket', () => {
    it('Заполняет рынок до максимального размера', async () => {
      mockedRoom.market.clear();
      const initialDeckCount = mockedRoom.deck.count;

      await mockedRoom.fillMarket(false);

      expect(mockedRoom.market.count).toBe(mockedRoom.settings.maxMarket);
      expect(mockedRoom.deck.count).toBe(initialDeckCount - 5);
    });

    it('Останавливается, если в стопке нет карт', async () => {
      mockedRoom.deck.clear();
      mockedRoom.market.clear();

      await mockedRoom.fillMarket();

      expect(mockedRoom.market.count).toBe(0);
    });

    it('Добавляет обычные карты на рынок', async () => {
      const card = new SoulfireAltar(mockedRoom);
      mockedRoom.deck.addCardToTop(card);
      mockedRoom.market.array.pop();
      const initialMarketCount = mockedRoom.market.count;

      await mockedRoom.fillMarket();

      expect(mockedRoom.market.count).toBe(initialMarketCount + 1);
      expect(mockedRoom.market.top).toBe(card);
    });

    it('Играет хаос карты, если canChaos = true', async () => {
      const chaosCard = new MockCard({ room: mockedRoom, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
      mockedRoom.deck.addCardToTop(chaosCard);
      const playChaosSpy = vi.spyOn(mockedRoom, 'playChaos').mockResolvedValue(undefined);
      mockedRoom.market.array.pop();

      await mockedRoom.fillMarket();

      expect(playChaosSpy).toHaveBeenCalledWith(chaosCard);
    });

    it('Не играет хаос карты, если canChaos = false', async () => {
      const chaosCard = new MockCard({ room: mockedRoom, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
      const card1 = new MockCard({ room: mockedRoom });
      const card2 = new MockCard({ room: mockedRoom });
      mockedRoom.deck.clear();
      mockedRoom.deck.addCardToTop(card1);
      mockedRoom.deck.addCardToTop(card2);
      mockedRoom.deck.addCardToTop(chaosCard);
      vi.spyOn(mockedRoom, 'playChaos');
      mockedRoom.market.array.pop();
      const initialRemovedChaosCount = mockedRoom.removed.chaos.count;

      await mockedRoom.fillMarket(false);

      expect(mockedRoom.playChaos).not.toHaveBeenCalled();
      expect(mockedRoom.removed.chaos.count).toBe(initialRemovedChaosCount);
      expect(mockedRoom.deck.count).toBe(2);
      expect(mockedRoom.deck.getCard(chaosCard)).toBe(chaosCard);
      expect(mockedRoom.removed.chaos.count).toBe(0);
    });

    it('Не играет хаос, если нет активного участника', async () => {
      const chaosCard = new MockCard({ room: mockedRoom, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
      mockedRoom.deck.clear();
      mockedRoom.deck.addCardToTop(chaosCard);
      mockedRoom.activePlayerNickname = undefined;
      mockedRoom.market.array.pop();
      vi.spyOn(mockedRoom, 'playChaos');
      const initialRemovedChaosCount = mockedRoom.removed.chaos.count;

      await mockedRoom.fillMarket();

      expect(mockedRoom.playChaos).not.toHaveBeenCalled();
      expect(mockedRoom.removed.chaos.count).toBe(initialRemovedChaosCount + 1);
      expect(mockedRoom.removed.chaos.top).toBe(chaosCard);
    });

    it('Добавляет лог о начале заполнения рынка', async () => {
      await mockedRoom.fillMarket();

      expect(mockedRoom.logger.info).toHaveBeenCalledWith('Начали заполнять рынок');
    });

    it('Добавляет лог о добавлении карты на рынок', async () => {
      const card = new SoulfireAltar(mockedRoom);
      mockedRoom.deck.addCardToTop(card);

      await mockedRoom.fillMarket();

      expect(mockedRoom.logger.info).toHaveBeenCalledWith('Добавлена карта на рынок');
    });

    it('Добавляет лог о завершении заполнения рынка', async () => {
      await mockedRoom.fillMarket();

      expect(mockedRoom.logger.info).toHaveBeenCalledWith('Закончили заполнять рынок');
    });

    it('Обрабатывает смешанные карты (обычные и хаос)', async () => {
      const normalCard = new SoulfireAltar(mockedRoom);
      const chaosCard = new MockCard({ room: mockedRoom, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
      mockedRoom.deck.addCardToTop(normalCard);
      mockedRoom.deck.addCardToTop(chaosCard);
      mockedRoom.market.array.pop();
      vi.spyOn(mockedRoom, 'playChaos').mockResolvedValue(undefined);
      const initialMarketCount = mockedRoom.market.count;
      const initialRemovedChaosCount = mockedRoom.removed.chaos.count;

      await mockedRoom.fillMarket();

      expect(mockedRoom.market.count).toBe(initialMarketCount + 1);
      expect(mockedRoom.removed.chaos.count).toBe(initialRemovedChaosCount + 1);
      expect(mockedRoom.playChaos).toHaveBeenCalledWith(chaosCard);
    });
  });

  describe('playChaos', () => {
    it('Не выполняет действия, если нет активного участника', async () => {
      mockedRoom.activePlayerNickname = undefined;
      const card = new MockCard({ room: mockedRoom, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
      mockedRoom.socketService.emitToPlayers = vi.fn();
      mockedRoom.socketService.selectCards = vi.fn();

      await mockedRoom.playChaos(card);

      expect(mockedRoom.activeChaos).toBeUndefined();
      expect(mockedRoom.socketService.emitToPlayers).not.toHaveBeenCalled();
      expect(mockedRoom.socketService.selectCards).not.toHaveBeenCalled();
    });

    it('Устанавливает активный хаос', async () => {
      const card = new MockCard({ room: mockedRoom, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
      mockedRoom.socketService.emitToPlayers = vi.fn();
      mockedRoom.socketService.selectCards = vi.fn().mockResolvedValue({ variant: 1 });
      card.play = vi.fn().mockResolvedValue(undefined);

      expect(mockedRoom.activeChaos).toBeUndefined();
      const playing = mockedRoom.playChaos(card);
      expect(mockedRoom.activeChaos).toBe(card);
      await playing;
      expect(mockedRoom.activeChaos).toBeUndefined();
    });

    it('Добавляет лог о хаосе', async () => {
      const card = new MockCard({ room: mockedRoom, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
      mockedRoom.socketService.emitToPlayers = vi.fn();
      mockedRoom.socketService.selectCards = vi.fn().mockResolvedValue({ variant: 1 });
      card.play = vi.fn().mockResolvedValue(undefined);

      await mockedRoom.playChaos(card);

      expect(mockedRoom.logs.count).toBe(1);
      expect(mockedRoom.logs.array[0].format().message).toBe('ХАОС!!!');
    });

    it('Играет карту при подтверждении', async () => {
      const card = new MockCard({ room: mockedRoom, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
      mockedRoom.socketService.emitToPlayers = vi.fn();
      card.play = vi.fn().mockResolvedValue(undefined);

      await mockedRoom.playChaos(card);

      expect(card.play).toHaveBeenCalledWith({
        tempPlayer: activePlayer,
        isForChaos: true,
      });
    });

    it('Сбрасывает активный хаос после игры', async () => {
      const card = new MockCard({ room: mockedRoom, name: 'Хаос', type: CryptozShared.ECardType.CHAOS });
      mockedRoom.socketService.emitToPlayers = vi.fn();
      mockedRoom.socketService.selectCards = vi.fn().mockResolvedValue({ variant: 1 });
      card.play = vi.fn().mockResolvedValue(undefined);

      await mockedRoom.playChaos(card);

      expect(mockedRoom.activeChaos).toBeUndefined();
    });
  });

  it('Комната удаляется', () => {
    mockedRoom.socketService.emitToPlayers = vi.fn();
    mockedRoom.socketService.close = vi.fn();

    mockedRoom.removeRoom();

    expect(mockedRoom.socketService.emitToPlayers).toHaveBeenCalledTimes(1);
    expect(mockedRoom.socketService.close).toHaveBeenCalledTimes(1);
  });

  it('Логи добавляются', () => {
    mockedRoom.socketService.emitToPlayers = vi.fn();
    mockedRoom.addLog('test');
    expect(mockedRoom.logs.count).toBe(1);
    expect(mockedRoom.logs.array[0].format().message).toBe('test');
    expect(mockedRoom.socketService.emitToPlayers).toHaveBeenCalledTimes(2);
  });

  it('Активный участник определяется корректно', () => {
    expect(mockedRoom.activePlayer).toBe(activePlayer);
    expect(mockedRoom.activePlayerNickname).toBe(activePlayer.nickname);
    mockedRoom.activePlayerNickname = player.nickname;
    expect(mockedRoom.activePlayer).toBe(player);
    mockedRoom.activePlayerNickname = undefined;
    expect(mockedRoom.activePlayer).toBeNull();
  });

  it('Админ определяется корректно', () => {
    expect(mockedRoom.adminPlayer).toBe(activePlayer);
    expect(mockedRoom.adminNickname).toBe(activePlayer.nickname);
    mockedRoom.adminNickname = player.nickname;
    expect(mockedRoom.adminPlayer).toBe(player);
    mockedRoom.adminNickname = undefined;
    expect(mockedRoom.adminPlayer).toBeNull();
  });

  it('Участники и наблюдатели определяются корректно', () => {
    expect(mockedRoom.players.count).toBe(2);
    expect(mockedRoom.viewers.count).toBe(0);
    expect(mockedRoom.playersAndViewers.count).toBe(2);
    mockedRoom.viewers.addPlayerToBottom(new Player({ nickname: 'Наблюдатель', room: mockedRoom, participant: 'viewer' }));
    expect(mockedRoom.players.count).toBe(2);
    expect(mockedRoom.viewers.count).toBe(1);
    expect(mockedRoom.playersAndViewers.count).toBe(3);
  });

  it('Информация о комнате отправляется', () => {
    mockedRoom.socketService.emitToPlayers = vi.fn();
    mockedRoom.viewers.addPlayerToBottom(new Player({ nickname: 'Наблюдатель', room: mockedRoom, participant: 'viewer' }));
    mockedRoom.sendInfo();
    expect(mockedRoom.socketService.emitToPlayers).toHaveBeenCalledTimes(3);
  });

  it('Форматирует для каждого пользователя', () => {
    const formatted = mockedRoom.formatForAllPlayers();
    expect(formatted).toHaveLength(2);
    expect(formatted[0].players).toHaveLength(2);
    expect(formatted[0].players[0].nickname).toBe('Активный участник');
    expect(formatted[0].players[1].nickname).toBe('Участник');
  });

  it('Форматирует комнату', () => {
    const mockedRoom = createMockRoom();
    const activePlayer = new Player({ nickname: 'Активный участник', room: mockedRoom, participant: 'player' });
    const player = new Player({ nickname: 'Участник', room: mockedRoom, participant: 'player' });
    addPlayerToRoom(activePlayer, mockedRoom);
    addPlayerToRoom(player, mockedRoom);
    mockedRoom.activePlayerNickname = activePlayer.nickname;
    mockedRoom.adminNickname = activePlayer.nickname;
    mockedRoom.isGameStarted = true;

    const formatted = mockedRoom.format(activePlayer);
    expect(formatted.darknessCrown).toEqual(mockedRoom.darknessCrown.format());
    expect(formatted.activeChaos).toBeUndefined();
    expect(formatted.activePlayerNickname).toBe(activePlayer.nickname);
    expect(formatted.adminNickname).toBe(activePlayer.nickname);
    expect(formatted.countDeck).toBe(124 - 5); // - 5 карты, которые уходят на рынок
    expect(formatted.playerNickname).toBe(activePlayer.nickname);
    expect(formatted.isGameEnded).toBeFalsy();
    expect(formatted.isGameStarted).toBeTruthy();
    expect(formatted.countHarbingers).toBe(12);
    expect(formatted.countViewers).toBe(0);
    expect(formatted.harbinger?.id).toBe(CryptozShared.ECardId.DREAD_ONE_EYED_WARRIOR);
    expect(formatted.name).toBe(mockedRoom.name);
    expect(formatted.players).toHaveLength(2);
    expect(formatted.abilities).toHaveLength(8);
    expect(formatted.removed.cards).toHaveLength(0);
    expect(formatted.removed.chaos).toHaveLength(0);
    expect(formatted.market).toHaveLength(5);
    expect(formatted.stoneShards).toHaveLength(20);
    expect(formatted.darknessMadness).toHaveLength(16);
    expect(formatted.cursedSeal).toHaveLength(16);
    expect(formatted.pendingAckNicknames).toHaveLength(0);
  });
});
