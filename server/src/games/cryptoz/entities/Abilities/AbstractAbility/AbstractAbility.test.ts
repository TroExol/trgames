import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Logger } from '@/helpers/Logger';
import { createMockRoom, createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';

import type { Room } from '../../Rooms/Room';
import type { Player } from '../../Players/Player';

import { AbstractAbility } from './AbstractAbility';

const canPlayHandler = vi.fn().mockReturnValue(true);
const playHandler = vi.fn().mockResolvedValue(true);
const onChangeOwner = vi.fn();

class TestAbility extends AbstractAbility {
  constructor(room?: Room) {
    super({
      id: 1,
      room,
    });
  }

  canPlayHandler = canPlayHandler;

  protected getDescription = () => '';

  protected onChangeOwner = onChangeOwner;

  protected playHandler = playHandler;
}

describe('AbstractAbility', () => {
  let ability: TestAbility;
  let activePlayer: Player;
  let player: Player;
  let room: Room;

  beforeEach(() => {
    const mocks = createMockRoomWithPlayers();
    room = mocks.room;
    activePlayer = mocks.activePlayer;
    player = mocks.player;
    ability = new TestAbility(room);
  });

  it('Инстанс создается', () => {
    const ability = new TestAbility();
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(1);
    expect(ability.logger).toBeInstanceOf(Logger);
  });

  it('Инстанс создается с комнатой', () => {
    const room = createMockRoom();
    const ability = new TestAbility(room);
    expect(ability).toBeDefined();
    expect(ability.uuid).toBeDefined();
    expect(ability.id).toBe(1);
    expect(ability.logger).toBeInstanceOf(Logger);
    expect(ability.room).toBe(room);
  });

  it('Сравнивание работает корректно', () => {
    const otherAbility = new TestAbility(room);
    expect(ability.theSame(ability)).toBeTruthy();
    expect(ability.theSame(otherAbility)).toBeFalsy();
    expect(ability.theSameId(1)).toBeTruthy();
    expect(ability.theSameId(2)).toBeFalsy();
  });

  it('Владелец определяется конкретно', () => {
    expect(ability.owner).toBeNull();
    ability.changeOwner(activePlayer.nickname);
    expect(ability.owner).toBe(activePlayer);
    expect(onChangeOwner).toHaveBeenCalledTimes(1);
  });

  it('Форматирует корректно', () => {
    const formatted = ability.format();
    expect(formatted).toEqual({
      uuid: ability.uuid,
      id: ability.id,
      description: '',
      canPlayHandler: true,
      isPlaying: false,
      isPlayed: false,
      ownerNickname: ability.ownerNickname,
    });
  });

  describe('play', () => {
    it('Способность разыгрывается', async () => {
      ability.changeOwner(activePlayer.nickname);
      activePlayer.abilities.addAbilityToTop(ability);
      await ability.play();
      expect(playHandler).toHaveBeenCalledTimes(1);
    });

    it('Нельзя разыграть, пока она разыгрывается', async () => {
      ability.changeOwner(activePlayer.nickname);
      activePlayer.abilities.addAbilityToTop(ability);
      const playingCard = ability.play();
      await ability.play();
      await playingCard;
      expect(playHandler).toHaveBeenCalledTimes(1);
    });

    it('Нельзя разыграть, когда уже разыгралась', async () => {
      ability.changeOwner(activePlayer.nickname);
      activePlayer.abilities.addAbilityToTop(ability);
      await ability.play();
      await ability.play();
      expect(playHandler).toHaveBeenCalledTimes(1);
    });

    it('Нельзя разыграть, если закончилась игра', async () => {
      room.isGameEnded = true;
      ability.changeOwner(activePlayer.nickname);
      activePlayer.abilities.addAbilityToTop(ability);
      await ability.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
    });

    it('Нельзя разыграть, если нет активного участника', async () => {
      room.activePlayerNickname = undefined;
      ability.changeOwner(activePlayer.nickname);
      activePlayer.abilities.addAbilityToTop(ability);
      await ability.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
    });

    it('Нельзя разыграть, если участник не активен', async () => {
      ability.changeOwner(player.nickname);
      activePlayer.abilities.addAbilityToTop(ability);
      await ability.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
    });

    it('Нельзя разыграть, если нет у участника', async () => {
      ability.changeOwner(activePlayer.nickname);
      await ability.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
    });

    it('Если нельзя разыграть обработчик', async () => {
      canPlayHandler.mockReturnValueOnce(false);
      ability.changeOwner(activePlayer.nickname);
      activePlayer.abilities.addAbilityToTop(ability);
      await ability.play();
      expect(playHandler).toHaveBeenCalledTimes(0);
    });
  });
});
