import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AUTOPILOT_DELAY_MS, createAutopilot } from '@/games/lucid/room/autopilot';

describe('createAutopilot', () => {
  it('ходит не раньше срока', () => {
    const play = vi.fn();
    const autopilot = createAutopilot({ play });

    autopilot.schedule('a');
    vi.advanceTimersByTime(AUTOPILOT_DELAY_MS - 1);

    expect(play).not.toHaveBeenCalled();
  });

  it('по истечении срока ходит за игрока', () => {
    const play = vi.fn();
    const autopilot = createAutopilot({ play });

    autopilot.schedule('a');
    vi.advanceTimersByTime(AUTOPILOT_DELAY_MS);

    expect(play).toHaveBeenCalledWith('a');
  });

  it('вернувшийся игрок отменяет автопилот', () => {
    const play = vi.fn();
    const autopilot = createAutopilot({ play });

    autopilot.schedule('a');
    autopilot.cancel('a');
    vi.advanceTimersByTime(AUTOPILOT_DELAY_MS * 2);

    expect(play).not.toHaveBeenCalled();
  });

  it('за каждого отвалившегося свой срок', () => {
    const play = vi.fn();
    const autopilot = createAutopilot({ play });

    autopilot.schedule('a');
    autopilot.schedule('b');
    autopilot.cancel('a');
    vi.advanceTimersByTime(AUTOPILOT_DELAY_MS);

    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith('b');
  });

  it('остановка снимает все сроки', () => {
    const play = vi.fn();
    const autopilot = createAutopilot({ play });

    autopilot.schedule('a');
    autopilot.stop();
    vi.advanceTimersByTime(AUTOPILOT_DELAY_MS * 2);

    expect(play).not.toHaveBeenCalled();
  });
});
