import type { Namespace, Socket } from 'socket.io';

import { vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { CryptozShared } from '@trgames/shared';

import type { AbstractStoneShard } from '@/games/cryptoz/entities/StoneShards/AbstractStoneShard';
import type { AbstractAbility } from '@/games/cryptoz/entities/Abilities/AbstractAbility';

import { StoneShard1 } from '@/games/cryptoz/entities/StoneShards/customStoneShards/StoneShard1';
import { Room } from '@/games/cryptoz/entities/Rooms/Room';
import { Player } from '@/games/cryptoz/entities/Players/Player';
import { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

export const createMockRoom = () => {
  const room = new Room({
    uuid: '1',
    name: 'Тестовая комната',
    nsp: { disconnectSockets: vi.fn() } as unknown as Namespace,
    settings: {
      maxMarket: 5,
      maxPlayers: 5,
    },
  });
  room.isGameStarted = true;
  return room;
};

export const addPlayerToRoom = (player: Player, room: Room) => {
  room.players.addPlayerToBottom(player);
  const playerSocket = {
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    id: uuidv4(),
  } as unknown as Socket;
  room.socketService.sockets.addSocket(player.nickname, playerSocket);
  return { socket: playerSocket };
};

export const createMockRoomWithPlayers = () => {
  const room = createMockRoom();
  room.stoneShards.clear();
  room.stoneShards.addStoneShardToBottom(new StoneShard1(room));
  const activePlayer = new Player({ nickname: 'Активный участник', room, participant: 'player' });
  const player = new Player({ nickname: 'Участник', room, participant: 'player' });
  const { socket: activePlayerSocket } = addPlayerToRoom(activePlayer, room);
  const { socket: playerSocket } = addPlayerToRoom(player, room);
  room.activePlayerNickname = activePlayer.nickname;
  room.adminNickname = activePlayer.nickname;
  room.isGameStarted = true;
  return {
    room,
    activePlayer,
    player,
    activePlayerSocket,
    playerSocket,
  };
};

export const addCardToPlayerHand = (card: AbstractCard, player: Player) => {
  card.changeOwner(player.nickname);
  player.hand.addCardToTop(card);
};

export const addCardToPlayerDeck = (card: AbstractCard, player: Player) => {
  card.changeOwner(player.nickname);
  player.deck.addCardToTop(card);
};

export const addCardToPlayerDiscard = (card: AbstractCard, player: Player) => {
  card.changeOwner(player.nickname);
  player.discard.addCardToTop(card);
};

export const addCardToPlayerSeals = (card: AbstractCard, player: Player) => {
  card.changeOwner(player.nickname);
  player.seals.addCardToTop(card);
};

export const addCardToPlayerArena = (card: AbstractCard, player: Player) => {
  card.changeOwner(player.nickname);
  player.arena.addCardToTop(card);
};

export const addStoneShardToPlayer = (stoneShard: AbstractStoneShard, player: Player) => {
  stoneShard.changeOwner(player.nickname);
  player.stoneShards.addStoneShardToTop(stoneShard);
};

export const addAbilityToPlayer = (ability: AbstractAbility, player: Player) => {
  ability.changeOwner(player.nickname);
  player.abilities.addAbilityToTop(ability);
};

export class MockCard extends AbstractCard {
  constructor({
    room,
    id = CryptozShared.ECardId.MR_SHADOWCAT,
    target = CryptozShared.ECardTarget.UNDEFINED,
    type = CryptozShared.ECardType.RITUAL,
    price = 0,
    gloryShards = 0,
    essence = 0,
    isSeal = false,
    hasEvade = false,
    name = 'Тестовая карта',
  }: {
    room?: Room;
    id?: CryptozShared.ECardId;
    type?: CryptozShared.ECardType;
    target?: CryptozShared.ECardTarget;
    price?: number;
    gloryShards?: number;
    damage?: number;
    heal?: number;
    essence?: number;
    isSeal?: boolean;
    hasEvade?: boolean;
    name?: string;
  }) {
    super({
      name,
      id,
      target,
      type,
      price,
      baseEssence: essence,
      gloryShards,
      isSeal,
      hasEvade,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: '',
  });

  protected onChangeOwner = () => {};

  public canPlayGeneralHandler = () => false;
  protected playGeneralHandler = vi.fn().mockResolvedValue(false);

  public canPlayStrikeHandler = () => false;
  protected playStrikeHandler = vi.fn().mockResolvedValue(false);

  public canPlaySealHandler = () => false;
  protected playSealHandler = vi.fn().mockResolvedValue(false);

  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = vi.fn().mockResolvedValue(false);

  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = vi.fn().mockResolvedValue(false);
}
