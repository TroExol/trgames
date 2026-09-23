import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { TPartySnapshot } from '@/games/lucid/room/Party';

import { createStorage } from '@/games/lucid/storage/db';
import { createPartyGroup } from '@/games/lucid/room/PartyGroup';
import { CLEANUP_DELAY_MS, createCleanup } from '@/games/lucid/room/cleanup';

const setup = () => {
  const group = createPartyGroup({ storage: createStorage<TPartySnapshot>(':memory:') });
  const cleanup = createCleanup({ remove: uuid => group.remove(uuid) });
  const party = group.create({ uuid: 'p1', ownerId: 'a' });

  party.join({ playerId: 'a', nickname: 'Аня' });
  party.join({ playerId: 'b', nickname: 'Боря' });
  cleanup.sync(party);

  return { group, cleanup, party };
};

const empty = () => {
  const { group, cleanup, party } = setup();

  party.disconnect('a');
  party.disconnect('b');
  cleanup.sync(party);

  return { group, cleanup, party };
};

describe('удаление опустевших партий', () => {
  it('партия с живым составом не удаляется вовсе', () => {
    const { group } = setup();

    vi.advanceTimersByTime(CLEANUP_DELAY_MS * 2);

    expect(group.get('p1')).not.toBeNull();
  });

  it('опустевшая партия сразу не удаляется', () => {
    const { group } = empty();

    vi.advanceTimersByTime(CLEANUP_DELAY_MS - 1);

    expect(group.get('p1')).not.toBeNull();
  });

  it('по истечении отсрочки партия уходит и из памяти, и из базы', () => {
    const { group } = empty();

    vi.advanceTimersByTime(CLEANUP_DELAY_MS);

    // get поднимает партию из базы, если её нет в памяти: null здесь
    // означает, что не осталось ни там, ни там
    expect(group.get('p1')).toBeNull();
  });

  it('вернувшийся до истечения игрок отсрочку снимает', () => {
    const { group, cleanup, party } = empty();

    vi.advanceTimersByTime(CLEANUP_DELAY_MS / 2);
    party.join({ playerId: 'a', nickname: 'Аня' });
    cleanup.sync(party);
    vi.advanceTimersByTime(CLEANUP_DELAY_MS * 2);

    expect(group.get('p1')).not.toBeNull();
  });

  it('отсчёт идёт от момента, когда партия опустела, а не от каждой проверки', () => {
    const { group, cleanup, party } = empty();

    // Рассылки продолжаются и в пустой партии: за отсутствующих ходит
    // автопилот. Если бы проверка перевзводила срок, партия не умерла бы никогда
    vi.advanceTimersByTime(CLEANUP_DELAY_MS - 1);
    cleanup.sync(party);
    vi.advanceTimersByTime(1);

    expect(group.get('p1')).toBeNull();
  });
});
