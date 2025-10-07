import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import type { Room } from '../Room';

import { RoomGroup } from './RoomGroup';

describe('RoomGroup', () => {
  let roomGroup: RoomGroup;

  beforeEach(() => {
    roomGroup = new RoomGroup();
  });

  it('Инстанс создается', () => {
    expect(roomGroup).toBeInstanceOf(RoomGroup);
  });

  it('Добавляет комнаты', () => {
    roomGroup.addRoom({ uuid: '1' } as Room);
    expect(roomGroup.count).toBe(1);
    roomGroup.addRoom({ uuid: '2' } as Room);
    roomGroup.addRoom({ uuid: '3' } as Room);
    expect(roomGroup.count).toBe(3);
  });

  it('Удаляет комнаты', () => {
    const room1 = { uuid: '1' } as Room;
    roomGroup.addRoom(room1);
    roomGroup.addRoom({ uuid: '2' } as Room);
    roomGroup.addRoom({ uuid: '3' } as Room);

    expect(roomGroup.removeRoom(room1)).toBeTruthy();
    expect(roomGroup.count).toBe(2);
    expect(roomGroup.uuids).toEqual(['2', '3']);
    expect(roomGroup.removeRoom(room1)).toBeFalsy();
    expect(roomGroup.count).toBe(2);
  });

  it('Удаляет комнаты по uuid', () => {
    roomGroup.addRoom({ uuid: '1' } as Room);
    roomGroup.addRoom({ uuid: '2' } as Room);
    roomGroup.addRoom({ uuid: '3' } as Room);

    expect(roomGroup.removeRoomByUuid('3')).toBeTruthy();
    expect(roomGroup.count).toBe(2);
    expect(roomGroup.uuids).toEqual(['1', '2']);
    expect(roomGroup.removeRoomByUuid('3')).toBeFalsy();
    expect(roomGroup.count).toBe(2);
  });

  it('Получение комнаты и uuid работает корректно', () => {
    const room1 = { uuid: '1' } as Room;

    expect(roomGroup.getRoomByUuid('1')).toBeNull();
    expect(roomGroup.getRoom(room1)).toBeNull();

    roomGroup.addRoom(room1);
    roomGroup.addRoom({ uuid: '2' } as Room);

    expect(roomGroup.getRoomByUuid('1')).toBe(room1);
    expect(roomGroup.getRoom(room1)).toBe(room1);
  });

  it('Получение количества работает корректно', () => {
    expect(roomGroup.count).toBe(0);

    roomGroup.addRoom({ uuid: '1' } as Room);
    roomGroup.addRoom({ uuid: '2' } as Room);

    expect(roomGroup.count).toBe(2);
  });

  it('Очищается', () => {
    roomGroup.addRoom({ uuid: '1' } as Room);
    roomGroup.addRoom({ uuid: '2' } as Room);

    roomGroup.clear();

    expect(roomGroup.count).toBe(0);
  });

  it('Возвращает список uuid', () => {
    expect(roomGroup.uuids).toEqual([]);

    roomGroup.addRoom({ uuid: '1' } as Room);
    roomGroup.addRoom({ uuid: '2' } as Room);

    expect(roomGroup.uuids).toEqual(['1', '2']);
  });

  it('Возвращает список комнат', () => {
    expect(roomGroup.rooms).toEqual([]);

    const room1 = { uuid: '1' } as Room;
    roomGroup.addRoom(room1);
    const room2 = { uuid: '2' } as Room;
    roomGroup.addRoom(room2);

    expect(roomGroup.rooms).toEqual([room1, room2]);
  });

  it('Возвращает список пар uuid и комнат', () => {
    expect(roomGroup.entries).toEqual([]);

    const room1 = { uuid: '1' } as Room;
    roomGroup.addRoom(room1);
    const room2 = { uuid: '2' } as Room;
    roomGroup.addRoom(room2);

    expect(roomGroup.entries).toEqual([['1', room1], ['2', room2]]);
  });
});
