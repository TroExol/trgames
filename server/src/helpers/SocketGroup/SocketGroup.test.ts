import type { Socket } from 'socket.io';

import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { SocketGroup } from './SocketGroup';

describe('SocketGroup', () => {
  let socketGroup: SocketGroup;

  beforeEach(() => {
    socketGroup = new SocketGroup();
  });

  it('Инстанс создается', () => {
    expect(socketGroup).toBeInstanceOf(SocketGroup);
  });

  it('Добавляет сокеты', () => {
    socketGroup.addSocket('1', {} as Socket);
    expect(socketGroup.count).toBe(1);
    socketGroup.addSocket('2', {} as Socket);
    socketGroup.addSocket('3', {} as Socket);
    expect(socketGroup.count).toBe(3);
  });

  it('Удаляет сокеты', () => {
    const socket1 = {} as Socket;
    socketGroup.addSocket('1', socket1);
    socketGroup.addSocket('2', {} as Socket);
    socketGroup.addSocket('3', {} as Socket);

    expect(socketGroup.removeSocket(socket1)).toBeTruthy();
    expect(socketGroup.count).toBe(2);
    expect(socketGroup.nicknames).toEqual(['2', '3']);
    expect(socketGroup.removeSocket(socket1)).toBeFalsy();
    expect(socketGroup.count).toBe(2);
  });

  it('Удаляет сокеты по никнейму', () => {
    socketGroup.addSocket('1', {} as Socket);
    socketGroup.addSocket('2', {} as Socket);
    socketGroup.addSocket('3', {} as Socket);

    expect(socketGroup.removeSocketByNickname('3')).toBeTruthy();
    expect(socketGroup.count).toBe(2);
    expect(socketGroup.nicknames).toEqual(['1', '2']);
    expect(socketGroup.removeSocketByNickname('3')).toBeFalsy();
    expect(socketGroup.count).toBe(2);
  });

  it('Получение сокета и никнейма работает корректно', () => {
    const socket1 = {} as Socket;

    expect(socketGroup.getSocketByNickname('1')).toBeNull();
    expect(socketGroup.getNickname(socket1)).toBeNull();
    expect(socketGroup.getSocket(socket1)).toBeNull();

    socketGroup.addSocket('1', socket1);
    socketGroup.addSocket('2', {} as Socket);

    expect(socketGroup.getSocketByNickname('1')).toBe(socket1);
    expect(socketGroup.getNickname(socket1)).toBe('1');
    expect(socketGroup.getSocket(socket1)).toBe(socket1);
  });

  it('Получение количества работает корректно', () => {
    expect(socketGroup.count).toBe(0);

    socketGroup.addSocket('1', {} as Socket);
    socketGroup.addSocket('2', {} as Socket);

    expect(socketGroup.count).toBe(2);
  });

  it('Очищается', () => {
    socketGroup.addSocket('1', {} as Socket);
    socketGroup.addSocket('2', {} as Socket);

    socketGroup.clear();

    expect(socketGroup.count).toBe(0);
  });

  it('Возвращает список никнеймов', () => {
    expect(socketGroup.nicknames).toEqual([]);

    socketGroup.addSocket('1', {} as Socket);
    socketGroup.addSocket('2', {} as Socket);

    expect(socketGroup.nicknames).toEqual(['1', '2']);
  });

  it('Возвращает список сокетов', () => {
    expect(socketGroup.sockets).toEqual([]);

    const socket1 = {} as Socket;
    socketGroup.addSocket('1', socket1);
    const socket2 = {} as Socket;
    socketGroup.addSocket('2', socket2);

    expect(socketGroup.sockets).toEqual([socket1, socket2]);
  });

  it('Возвращает список пар никнеймов и сокетов', () => {
    expect(socketGroup.entries).toEqual([]);

    const socket1 = {} as Socket;
    socketGroup.addSocket('1', socket1);
    const socket2 = {} as Socket;
    socketGroup.addSocket('2', socket2);

    expect(socketGroup.entries).toEqual([['1', socket1], ['2', socket2]]);
  });
});
