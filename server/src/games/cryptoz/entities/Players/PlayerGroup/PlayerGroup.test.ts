import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { createMockRoom } from '@/games/cryptoz/vitest/utils';

import { PlayerGroup } from './PlayerGroup';
import { Player } from '../Player';

describe('PlayerGroup', () => {
  let playerGroup: PlayerGroup;
  const room = createMockRoom();

  beforeEach(() => {
    playerGroup = new PlayerGroup();
  });

  it('Инстанс создается', () => {
    expect(playerGroup).toBeInstanceOf(PlayerGroup);
  });

  it('Добавляет Участников', () => {
    const player1 = new Player({ nickname: 'Участник 1', room, participant: 'player' });
    const player2 = new Player({ nickname: 'Участник 2', room, participant: 'player' });
    const player3 = new Player({ nickname: 'Участник 3', room, participant: 'player' });

    playerGroup.addPlayerToTop(player1);
    expect(playerGroup.top).toBe(player1);
    expect(playerGroup.bottom).toBe(player1);
    expect(playerGroup.count).toBe(1);
    playerGroup.addPlayerToBottom(player2);
    expect(playerGroup.top).toBe(player1);
    expect(playerGroup.bottom).toBe(player2);
    expect(playerGroup.count).toBe(2);
    playerGroup.addPlayerToTop(player3);
    expect(playerGroup.top).toBe(player3);
    expect(playerGroup.bottom).toBe(player2);
    expect(playerGroup.count).toBe(3);
  });

  it('Удаляет участников', () => {
    const player1 = new Player({ nickname: 'Участник 1', room, participant: 'player' });
    const player2 = new Player({ nickname: 'Участник 2', room, participant: 'player' });

    playerGroup.addPlayerToBottom(player1);
    playerGroup.addPlayerToBottom(player2);

    expect(playerGroup.removePlayer(player1)).toBeTruthy();
    expect(playerGroup.count).toBe(1);
    expect(playerGroup.getPlayer(player1)).toBeNull();
    expect(playerGroup.getPlayer(player2)).toBe(player2);
    expect(playerGroup.removePlayer(player1)).toBeFalsy();
    expect(playerGroup.count).toBe(1);
    expect(playerGroup.removePlayerByNickname(player1.nickname)).toBeFalsy();
    expect(playerGroup.count).toBe(1);
    expect(playerGroup.removePlayerByNickname(player2.nickname)).toBeTruthy();
    expect(playerGroup.count).toBe(0);
  });

  it('Клонирует', () => {
    const clone = playerGroup.clone();
    expect(clone).not.toBe(playerGroup);
  });

  it('Получение участников работает корректно', () => {
    const player1 = new Player({ nickname: 'Участник 1', room, participant: 'player' });
    const player2 = new Player({ nickname: 'Участник 2', room, participant: 'player' });

    expect(playerGroup.getPlayer(player1)).toBeNull();
    expect(playerGroup.getPlayerByNickname(player1.nickname)).toBeNull();

    playerGroup.addPlayerToBottom(player1);
    playerGroup.addPlayerToBottom(player2);

    expect(playerGroup.getPlayer(player1)).toBe(player1);
    expect(playerGroup.getPlayerByNickname(player1.nickname)).toBe(player1);
    expect(playerGroup.getPlayersExceptPlayer(player1).count).toBe(1);
    expect(playerGroup.getPlayersExceptPlayer(player1).getPlayer(player2)).toBe(player2);
  });

  it('Получение количества работает корректно', () => {
    expect(playerGroup.count).toBe(0);
    const player1 = new Player({ nickname: 'Участник 1', room, participant: 'player' });
    const player2 = new Player({ nickname: 'Участник 2', room, participant: 'player' });

    playerGroup.addPlayerToBottom(player1);
    playerGroup.addPlayerToBottom(player2);

    expect(playerGroup.count).toBe(2);
  });

  it('Получение участников по сторонам работает корректно', () => {
    const player1 = new Player({ nickname: 'Участник 1', room, participant: 'player' });
    const player2 = new Player({ nickname: 'Участник 2', room, participant: 'player' });
    const player3 = new Player({ nickname: 'Участник 3', room, participant: 'player' });

    expect(playerGroup.getLeftPlayer(player1)).toBeNull();
    expect(playerGroup.getRightPlayer(player1)).toBeNull();

    playerGroup.addPlayerToBottom(player1);

    expect(playerGroup.getLeftPlayer(player1)).toBeNull();
    expect(playerGroup.getRightPlayer(player1)).toBeNull();

    playerGroup.addPlayerToBottom(player2);

    expect(playerGroup.getLeftPlayer(player1)).toBe(player2);
    expect(playerGroup.getRightPlayer(player1)).toBe(player2);

    playerGroup.addPlayerToBottom(player3);

    expect(playerGroup.getLeftPlayer(player1)).toBe(player2);
    expect(playerGroup.getRightPlayer(player1)).toBe(player3);
  });

  it('Получение участников с минимальным здоровьем', () => {
    const player1 = new Player({ nickname: 'Участник 1', room, participant: 'player' });
    const player2 = new Player({ nickname: 'Участник 2', room, participant: 'player' });
    const player3 = new Player({ nickname: 'Участник 3', room, participant: 'player' });

    playerGroup.addPlayerToBottom(player1);
    playerGroup.addPlayerToBottom(player2);
    playerGroup.addPlayerToBottom(player3);

    expect(playerGroup.minHpPlayers.array).toEqual([player1, player2, player3]);
    player3.health = 21;
    expect(playerGroup.minHpPlayers.array).toEqual([player1, player2]);
    player1.health = 19;
    expect(playerGroup.minHpPlayers.array).toEqual([player1]);
  });

  it('Получение участников с максимальным здоровьем', () => {
    const player1 = new Player({ nickname: 'Участник 1', room, participant: 'player' });
    const player2 = new Player({ nickname: 'Участник 2', room, participant: 'player' });
    const player3 = new Player({ nickname: 'Участник 3', room, participant: 'player' });

    playerGroup.addPlayerToBottom(player1);
    playerGroup.addPlayerToBottom(player2);
    playerGroup.addPlayerToBottom(player3);

    expect(playerGroup.maxHpPlayers.array).toEqual([player1, player2, player3]);
    player3.health = 19;
    expect(playerGroup.maxHpPlayers.array).toEqual([player1, player2]);
    player1.health = 21;
    expect(playerGroup.maxHpPlayers.array).toEqual([player1]);
  });

  it('Очищается', () => {
    const player1 = new Player({ nickname: 'Участник 1', room, participant: 'player' });
    const player2 = new Player({ nickname: 'Участник 2', room, participant: 'player' });

    playerGroup.addPlayerToBottom(player1);
    playerGroup.addPlayerToBottom(player2);

    playerGroup.clear();

    expect(playerGroup.count).toBe(0);
  });

  it('Возвращает список никнеймов', () => {
    const player1 = new Player({ nickname: 'Участник 1', room, participant: 'player' });
    const player2 = new Player({ nickname: 'Участник 2', room, participant: 'player' });

    expect(playerGroup.nicknames).toEqual([]);

    playerGroup.addPlayerToBottom(player1);
    playerGroup.addPlayerToBottom(player2);

    expect(playerGroup.nicknames).toEqual(['Участник 1', 'Участник 2']);
  });
});
