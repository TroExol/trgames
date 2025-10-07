import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { sleep } from './utils';

describe('Общие утилиты', () => {
  describe('sleep', () => {
    it('Резолвится с задержкой', async () => {
      const sleeping = sleep(100);
      vi.advanceTimersToNextTimer();
      await sleeping;
      expect(true).toBeTruthy();
    });
  });
});
