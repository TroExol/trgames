import type { Namespace, Socket } from 'socket.io';

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import _ from 'lodash';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { createMockRoom, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';
import { EStoneShardGroupType, StoneShardGroup } from '@/games/cryptoz/entities/StoneShards/StoneShardGroup';
import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';
import { Player } from '@/games/cryptoz/entities/Players/Player';
import { Oblivion } from '@/games/cryptoz/entities/Cards/customCards/Oblivion';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import { Ability2 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability2';
import { AbilityGroup, EAbilityGroupType } from '@/games/cryptoz/entities/Abilities/AbilityGroup';

import { SocketsService } from './SocketsService';

describe('SocketsService', () => {
  let nsp: Namespace;
  let room: Room;
  let activePlayer: Player;
  let player: Player;
  let activePlayerSocket: Socket;
  let playerSocket: Socket;
  let socketsService: SocketsService;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    activePlayerSocket = mocks.activePlayerSocket;
    playerSocket = mocks.playerSocket;
    nsp = {
      disconnectSockets: vi.fn(),
    } as unknown as Namespace;
    socketsService = new SocketsService({ room, nsp });
    socketsService.sockets.addSocket(activePlayer.nickname, activePlayerSocket);
    socketsService.sockets.addSocket(player.nickname, playerSocket);
  });

  it('Создается инстанс', () => {
    room = createMockRoom();
    nsp = {} as Namespace;
    socketsService = new SocketsService({ room, nsp });
    expect(socketsService).toBeInstanceOf(SocketsService);
  });

  it('Закрывает подключение для всех сокетов', () => {
    socketsService.close();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(nsp.disconnectSockets).toHaveBeenCalled();
  });

  it('Отключает сокет', () => {
    socketsService.disconnect(activePlayer);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(activePlayerSocket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('Отправляет сообщение участникам', () => {
    socketsService.emitToPlayers(room.players, CryptozShared.EEventTypes.showToast, { message: 'test' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(activePlayerSocket.emit).toHaveBeenCalledWith(CryptozShared.EEventTypes.showToast, { message: 'test' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(playerSocket.emit).toHaveBeenCalledWith(CryptozShared.EEventTypes.showToast, { message: 'test' });
  });

  describe('emitWithAck', () => {
    it('Отправляет сообщение участнику с ожиданием ответа', async () => {
      const card = new Oblivion(room).format();
      activePlayerSocket.emit = vi.fn().mockImplementationOnce((event, params, callback) => {
        expect(event).toBe(CryptozShared.EEventTypes.showModalSelectCards);
        expect(params).toEqual({ cards: [card], variants: [{ id: 1, value: 'value' }], count: 1 });
        expect(vi.getTimerCount()).toBe(1);
        expect(socketsService.pendingAck.size).toBe(1);
        if (_.isFunction(callback)) {
          callback('test');
        }
      });
      const pending = await socketsService
        .emitWithAck(activePlayer, CryptozShared.EEventTypes.showModalSelectCards, {
          cards: [card],
          variants: [{ id: 1, value: 'value' }],
          count: 1,
        });
      expect(pending).toBe('test');
      expect(vi.getTimerCount()).toBe(0);
      expect(socketsService.pendingAck.size).toBe(0);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(activePlayerSocket.emit).toHaveBeenCalledTimes(1);
    });

    it('Не отправляется, если участника нет', async () => {
      const newPlayer = new Player({ nickname: 'Новый участник', room, participant: 'player' });
      const card = new Oblivion(room).format();
      await expect(
        socketsService.emitWithAck(newPlayer, CryptozShared.EEventTypes.showModalSelectCards, {
          cards: [card],
          variants: [{ id: 1, value: 'value' }],
          count: 1,
        }),
      ).rejects.toThrowError(new Error('Участника Новый участник нет в игре'));
    });

    it('Останавливается, если участник пропал', async () => {
      const card = new Oblivion(room).format();
      const receiver = socketsService.emitWithAck(activePlayer, CryptozShared.EEventTypes.showModalSelectCards, {
        cards: [card],
        variants: [{ id: 1, value: 'value' }],
        count: 1,
      });
      room.removePlayer(activePlayer);
      vi.advanceTimersToNextTimer();
      await expect(receiver).rejects.toThrowError(new Error('Участника Активный участник нет в игре'));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(activePlayerSocket.emit).toHaveBeenCalled();
    });

    it('Делает перезапрос, если сокет изменился', async () => {
      const card = new Oblivion(room).format();
      const receiver = socketsService.emitWithAck(activePlayer, CryptozShared.EEventTypes.showModalSelectCards, {
        cards: [card],
        variants: [{ id: 1, value: 'value' }],
        count: 1,
      });
      socketsService.sockets.removeSocketByNickname(activePlayer.nickname);
      const newSocket = {
        emit: vi.fn().mockImplementation((event, params, callback) => {
          expect(event).toBe(CryptozShared.EEventTypes.showModalSelectCards);
          expect(params).toEqual({ cards: [card], variants: [{ id: 1, value: 'value' }], count: 1 });
          expect(vi.getTimerCount()).toBe(1);
          expect(socketsService.pendingAck.size).toBe(2);
          if (_.isFunction(callback)) {
            callback('test');
          }
        }),
        id: 1,
      } as unknown as Socket;
      socketsService.sockets.addSocket(activePlayer.nickname, newSocket);
      vi.advanceTimersToNextTimer();
      const response = await receiver;
      expect(socketsService.pendingAck.size).toBe(0);
      expect(response).toBe('test');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(activePlayerSocket.emit).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(newSocket.emit).toHaveBeenCalledTimes(1);
    });

    it('Делает перезапрос и останавливается, если участник пропал', async () => {
      const card = new Oblivion(room).format();
      const receiver = socketsService.emitWithAck(activePlayer, CryptozShared.EEventTypes.showModalSelectCards, {
        cards: [card],
        variants: [{ id: 1, value: 'value' }],
        count: 1,
      });
      socketsService.sockets.removeSocketByNickname(activePlayer.nickname);
      const newSocket = {
        emit: vi.fn().mockImplementation((event, params) => {
          expect(event).toBe(CryptozShared.EEventTypes.showModalSelectCards);
          expect(params).toEqual({ cards: [card], variants: [{ id: 1, value: 'value' }], count: 1 });
          expect(vi.getTimerCount()).toBe(1);
          expect(socketsService.pendingAck.size).toBe(2);
          room.removePlayer(activePlayer);
        }),
        id: 1,
      } as unknown as Socket;
      socketsService.sockets.addSocket(activePlayer.nickname, newSocket);
      vi.advanceTimersToNextTimer();
      vi.advanceTimersToNextTimer();
      await expect(receiver).rejects.toThrowError(new Error('Участника Активный участник нет в игре'));
      expect(socketsService.pendingAck.size).toBe(0);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(activePlayerSocket.emit).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(newSocket.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('selectCards', () => {
    it('Отправляет и получает запрос с несколькими картами', async () => {
      const card1 = new Oblivion(room);
      const card2 = new Oblivion(room);
      const cards = new CardGroup(ECardGroupType.ANY, [card1, card2]);
      socketsService.emitWithAck = vi.fn().mockResolvedValue({ variant: 1, selectedCards: [card2.format()] });
      const response = await socketsService.selectCards({ player: activePlayer, cards, variants: [{ id: 1, value: 'value' }] });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response.cards.count).toBe(1);
      expect(response.cards.getCard(card2)).toBeTruthy();
      expect(response.variant).toBe(1);
    });

    it('Отправляет и получает запрос с несколькими вариантами', async () => {
      const card1 = new Oblivion(room);
      const cards = new CardGroup(ECardGroupType.ANY, [card1]);
      socketsService.emitWithAck = vi.fn().mockResolvedValue({ variant: 2, selectedCards: [card1.format()] });
      const response = await socketsService.selectCards({ player: activePlayer, cards, variants: [{ id: 1, value: 'value' }, { id: 2, value: 'value' }] });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response.cards.count).toBe(1);
      expect(response.cards.getCard(card1)).toBeTruthy();
      expect(response.variant).toBe(2);
    });

    it('Не отправляет запрос, если вариантов выбора мало', async () => {
      const card1 = new Oblivion(room);
      const cards = new CardGroup(ECardGroupType.ANY, [card1]);
      socketsService.emitWithAck = vi.fn();
      const response = await socketsService.selectCards({ player: activePlayer, cards, variants: [{ id: 1, value: 'value' }] });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(0);
      expect(response.cards.count).toBe(1);
      expect(response.cards.getCard(card1)).toBeTruthy();
      expect(response.variant).toBe(1);
    });

    it('Не отправляет запрос, если вариантов выбора мало при указанном кол-ве карт', async () => {
      const card1 = new Oblivion(room);
      const card2 = new Oblivion(room);
      const cards = new CardGroup(ECardGroupType.ANY, [card1, card2]);
      socketsService.emitWithAck = vi.fn();
      const response = await socketsService.selectCards({ player: activePlayer, cards, variants: [{ id: 1, value: 'value' }], count: 3 });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(0);
      expect(response.cards.count).toBe(2);
      expect(response.cards.getCard(card1)).toBeTruthy();
      expect(response.variant).toBe(1);
    });

    it('Ошибка запроса', async () => {
      const card1 = new Oblivion(room);
      const card2 = new Oblivion(room);
      const cards = new CardGroup(ECardGroupType.ANY, [card1, card2]);
      socketsService.emitWithAck = vi.fn().mockRejectedValue(false);
      const response = await socketsService.selectCards({ player: activePlayer, cards, variants: [{ id: 1, value: 'value' }] });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response.cards.count).toBe(0);
      expect(response.variant).toBeUndefined();
    });

    it('Поддерживает count: null для выбора любого количества карт', async () => {
      const card1 = new Oblivion(room);
      const card2 = new Oblivion(room);
      const cards = new CardGroup(ECardGroupType.ANY, [card1, card2]);
      socketsService.emitWithAck = vi.fn().mockResolvedValue({
        variant: 1,
        selectedCards: [card1.format(), card2.format()],
      });
      const response = await socketsService.selectCards({
        player: activePlayer,
        cards,
        variants: [{ id: 1, value: 'value' }, { id: 2, value: 'value' }],
        count: null,
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(socketsService.emitWithAck).toHaveBeenCalledWith(
        activePlayer,
        CryptozShared.EEventTypes.showModalSelectCards,
        expect.objectContaining({
          count: null,
        }),
      );
      expect(response.cards.count).toBe(2);
      expect(response.cards.getCard(card1)).toBeTruthy();
      expect(response.cards.getCard(card2)).toBeTruthy();
      expect(response.variant).toBe(1);
    });

    it('Не отправляет запрос при count: null, если вариантов выбора мало', async () => {
      const card1 = new Oblivion(room);
      const cards = new CardGroup(ECardGroupType.ANY, [card1]);
      socketsService.emitWithAck = vi.fn();
      const response = await socketsService.selectCards({
        player: activePlayer,
        cards,
        variants: [{ id: 1, value: 'value' }],
        count: null,
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(0);
      expect(response.cards.count).toBe(1);
      expect(response.cards.getCard(card1)).toBeTruthy();
      expect(response.variant).toBe(1);
    });
  });

  describe('selectEvadeCard', () => {
    it('Отправляет и получает запрос', async () => {
      const cardAttack = new Oblivion(room);
      const card1 = new Oblivion(room);
      const card2 = new Oblivion(room);
      const cards = new CardGroup(ECardGroupType.ANY, [card1, card2]);
      socketsService.emitWithAck = vi.fn().mockResolvedValue({ variant: 1, selectedCard: card2.format() });
      const response = await socketsService.selectEvadeCard({ player: activePlayer, cards, cardAttack });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response).toBe(card2);
    });

    it('Отправляет и получает запрос при отмене укрытия', async () => {
      const cardAttack = new Oblivion(room);
      const card1 = new Oblivion(room);
      const card2 = new Oblivion(room);
      const cards = new CardGroup(ECardGroupType.ANY, [card1, card2]);
      socketsService.emitWithAck = vi.fn().mockResolvedValue({ variant: 2 });
      const response = await socketsService.selectEvadeCard({ player: activePlayer, cards, cardAttack });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response).toBeNull();
    });

    it('Ошибка запроса', async () => {
      const cardAttack = new Oblivion(room);
      const card1 = new Oblivion(room);
      const card2 = new Oblivion(room);
      const cards = new CardGroup(ECardGroupType.ANY, [card1, card2]);
      socketsService.emitWithAck = vi.fn().mockRejectedValue(false);
      const response = await socketsService.selectEvadeCard({ player: activePlayer, cards, cardAttack });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response).toBeNull();
    });
  });

  describe('selectStoneShards', () => {
    it('Отправляет и получает запрос с несколькими осколками Философского камня', async () => {
      const stoneShard1 = new StoneShard1(room);
      const stoneShard2 = new StoneShard1(room);
      const stoneShards = new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard1, stoneShard2]);
      socketsService.emitWithAck = vi.fn().mockResolvedValue({
        variant: 1,
        selectedStoneShards: [stoneShard2.format()],
      });
      const response = await socketsService.selectStoneShards({ player: activePlayer, stoneShards, variants: [{ id: 1, value: 'value' }] });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response.stoneShards.count).toBe(1);
      expect(response.stoneShards.getStoneShard(stoneShard2)).toBeTruthy();
      expect(response.variant).toBe(1);
    });

    it('Отправляет и получает запрос с несколькими вариантами', async () => {
      const stoneShard1 = new StoneShard1(room);
      const stoneShards = new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard1]);
      socketsService.emitWithAck = vi.fn().mockResolvedValue({
        variant: 2,
        selectedStoneShards: [stoneShard1.format()],
      });
      const response = await socketsService.selectStoneShards({ player: activePlayer, stoneShards, variants: [{ id: 1, value: 'value' }, { id: 2, value: 'value' }] });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response.stoneShards.count).toBe(1);
      expect(response.stoneShards.getStoneShard(stoneShard1)).toBeTruthy();
      expect(response.variant).toBe(2);
    });

    it('Не отправляет запрос, если вариантов выбора мало', async () => {
      const stoneShard1 = new StoneShard1(room);
      const stoneShards = new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard1]);
      socketsService.emitWithAck = vi.fn();
      const response = await socketsService.selectStoneShards({ player: activePlayer, stoneShards, variants: [{ id: 1, value: 'value' }] });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(0);
      expect(response.stoneShards.count).toBe(1);
      expect(response.stoneShards.getStoneShard(stoneShard1)).toBeTruthy();
      expect(response.variant).toBe(1);
    });

    it('Не отправляет запрос, если вариантов выбора мало при указанном кол-ве осколков Философского камня', async () => {
      const stoneShard1 = new StoneShard1(room);
      const stoneShard2 = new StoneShard1(room);
      const stoneShards = new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard1, stoneShard2]);
      socketsService.emitWithAck = vi.fn();
      const response = await socketsService.selectStoneShards({ player: activePlayer, stoneShards, variants: [{ id: 1, value: 'value' }], count: 3 });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(0);
      expect(response.stoneShards.count).toBe(2);
      expect(response.stoneShards.getStoneShard(stoneShard1)).toBeTruthy();
      expect(response.variant).toBe(1);
    });

    it('Ошибка запроса', async () => {
      const stoneShard1 = new StoneShard1(room);
      const stoneShard2 = new StoneShard1(room);
      const stoneShards = new StoneShardGroup(EStoneShardGroupType.ANY, [stoneShard1, stoneShard2]);
      socketsService.emitWithAck = vi.fn().mockRejectedValue(false);
      const response = await socketsService.selectStoneShards({ player: activePlayer, stoneShards, variants: [{ id: 1, value: 'value' }] });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response.stoneShards.count).toBe(0);
      expect(response.variant).toBeUndefined();
    });
  });

  describe('selectTarget', () => {
    it('Отправляет и получает запрос', async () => {
      socketsService.selectVariant = vi.fn().mockResolvedValue(activePlayer.nickname);
      const response = await socketsService.selectTarget({ player: activePlayer, targetsToSelect: room.players });
      expect(socketsService.selectVariant).toHaveBeenCalledTimes(1);
      expect(response).toBe(activePlayer);
    });

    it('Отправляет и получает запрос с одним участником', async () => {
      socketsService.selectVariant = vi.fn().mockResolvedValue(activePlayer.nickname);
      const response = await socketsService
        .selectTarget({ player: activePlayer, targetsToSelect: room.players.getPlayersExceptPlayer(activePlayer) });
      expect(socketsService.selectVariant).toHaveBeenCalledTimes(0);
      expect(response).toBe(player);
    });

    it('Отправляет и получает запрос, если не указывать участников', async () => {
      socketsService.selectVariant = vi.fn().mockResolvedValue(activePlayer.nickname);
      const response = await socketsService.selectTarget({ player: activePlayer });
      expect(socketsService.selectVariant).toHaveBeenCalledTimes(0);
      expect(response).toBe(player);
    });

    it('Отправляет и получает запрос, если не выбрали участника', async () => {
      socketsService.selectVariant = vi.fn().mockResolvedValue(undefined);
      const response = await socketsService.selectTarget({ player: activePlayer, targetsToSelect: room.players });
      expect(socketsService.selectVariant).toHaveBeenCalledTimes(1);
      expect(response).toBeNull();
    });

    it('Ошибка запроса', async () => {
      socketsService.selectVariant = vi.fn().mockRejectedValue(false);
      const response = await socketsService.selectTarget({ player: activePlayer, targetsToSelect: room.players });
      expect(socketsService.selectVariant).toHaveBeenCalledTimes(1);
      expect(response).toBeNull();
    });
  });

  describe('selectVariant', () => {
    it('Отправляет и получает запрос', async () => {
      socketsService.emitWithAck = vi.fn().mockResolvedValue({ variant: 1 });
      const response = await socketsService.selectVariant({
        player: activePlayer,
        variants: [{ id: 1, value: 'value' }, { id: 2, value: 'value' }],
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response).toBe(1);
    });

    it('Отправляет и получает запрос с одним вариантом', async () => {
      socketsService.emitWithAck = vi.fn().mockResolvedValue(activePlayer.nickname);
      const response = await socketsService.selectVariant({
        player: activePlayer,
        variants: [{ id: 1, value: 'value' }],
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(0);
      expect(response).toBe(1);
    });

    it('Отправляет и получает запрос, если не выбрали вариант', async () => {
      socketsService.emitWithAck = vi.fn().mockResolvedValue(undefined);
      const response = await socketsService.selectVariant({
        player: activePlayer,
        variants: [{ id: 1, value: 'value' }, { id: 2, value: 'value' }],
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response).toBeNull();
    });

    it('Ошибка запроса', async () => {
      socketsService.emitWithAck = vi.fn().mockRejectedValue(false);
      const response = await socketsService.selectVariant({
        player: activePlayer,
        variants: [{ id: 1, value: 'value' }, { id: 2, value: 'value' }],
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response).toBeNull();
    });
  });

  describe('selectAbilityAndCompanion', () => {
    it('Отправляет и получает запрос', async () => {
      const companion1 = new Oblivion(room);
      const companion2 = new Oblivion(room);
      const companions = new CardGroup(ECardGroupType.ANY, [companion1, companion2]);
      const ability1 = new Ability2(room);
      const ability2 = new Ability2(room);
      const abilities = new AbilityGroup(EAbilityGroupType.ANY, [ability1, ability2]);
      socketsService.emitWithAck = vi.fn().mockResolvedValue({
        ability: ability2.format(),
        companion: companion1.format(),
      });
      const response = await socketsService.selectAbilityAndCompanion({
        player: activePlayer,
        abilities: abilities,
        companions: companions,
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response).toEqual({ ability: ability2, companion: companion1 });
    });

    it('Не отправляет запрос, если выбора мало', async () => {
      const companion1 = new Oblivion(room);
      const companions = new CardGroup(ECardGroupType.ANY, [companion1]);
      const ability1 = new Ability2(room);
      const abilities = new AbilityGroup(EAbilityGroupType.ANY, [ability1]);
      socketsService.emitWithAck = vi.fn();
      const response = await socketsService.selectAbilityAndCompanion({
        player: activePlayer,
        abilities: abilities,
        companions: companions,
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(0);
      expect(response).toEqual({ ability: ability1, companion: companion1 });
    });

    it('Не отправляет запрос, если выбора нет', async () => {
      const companions = new CardGroup(ECardGroupType.ANY, []);
      const abilities = new AbilityGroup(EAbilityGroupType.ANY, []);
      socketsService.emitWithAck = vi.fn();
      const response = await socketsService.selectAbilityAndCompanion({
        player: activePlayer,
        abilities: abilities,
        companions: companions,
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(0);
      expect(response).toBeNull();
    });

    it('Отправляет и получает запрос, если карты или способности нет', async () => {
      const companion1 = new Oblivion(room);
      const companion2 = new Oblivion(room);
      const companions = new CardGroup(ECardGroupType.ANY, [companion1]);
      const ability1 = new Ability2(room);
      const ability2 = new Ability2(room);
      const abilities = new AbilityGroup(EAbilityGroupType.ANY, [ability1, ability2]);
      socketsService.emitWithAck = vi.fn().mockResolvedValue({
        ability: ability2.format(),
        companion: companion2.format(),
      });
      const response = await socketsService.selectAbilityAndCompanion({
        player: activePlayer,
        abilities: abilities,
        companions: companions,
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response).toBeNull();
    });

    it('Ошибка запроса', async () => {
      const companion1 = new Oblivion(room);
      const companion2 = new Oblivion(room);
      const companions = new CardGroup(ECardGroupType.ANY, [companion1, companion2]);
      const ability1 = new Ability2(room);
      const ability2 = new Ability2(room);
      const abilities = new AbilityGroup(EAbilityGroupType.ANY, [ability1, ability2]);
      socketsService.emitWithAck = vi.fn().mockRejectedValue(false);
      const response = await socketsService.selectAbilityAndCompanion({
        player: activePlayer,
        abilities: abilities,
        companions: companions,
      });
      expect(socketsService.emitWithAck).toHaveBeenCalledTimes(1);
      expect(response).toBeNull();
    });
  });

  it('Добавляет ожидающие запросы', () => {
    expect(socketsService.pendingAck.size).toBe(0);
    socketsService.addPendingAck('1', activePlayer);
    expect(socketsService.pendingAck.size).toBe(1);
    socketsService.addPendingAck('1', player);
    expect(socketsService.pendingAck.size).toBe(1);
  });

  it('Удаляет ожидающие запросы', () => {
    socketsService.addPendingAck('1', activePlayer);
    socketsService.removePendingAck('2');
    expect(socketsService.pendingAck.size).toBe(1);
    socketsService.removePendingAck('1');
    expect(socketsService.pendingAck.size).toBe(0);
  });

  it('Удаляет ожидающие запросы по никнейму', () => {
    socketsService.addPendingAck('1', activePlayer);
    socketsService.removePendingAcksByNickname(player.nickname);
    expect(socketsService.pendingAck.size).toBe(1);
    socketsService.removePendingAcksByNickname(activePlayer.nickname);
    expect(socketsService.pendingAck.size).toBe(0);
  });

  it('Возвращает никнеймы ожидающих запросов', () => {
    expect(socketsService.pendingAckNicknames).toEqual([]);
    socketsService.addPendingAck('1', activePlayer);
    expect(socketsService.pendingAckNicknames).toEqual([activePlayer.nickname]);
    socketsService.addPendingAck('2', player);
    expect(socketsService.pendingAckNicknames).toEqual([activePlayer.nickname, player.nickname]);
  });
});
