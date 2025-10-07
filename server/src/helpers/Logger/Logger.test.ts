import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import path from 'path';
import fs from 'fs';

import { MOCKED_CURRENT_DATE } from '@/vitest/constants';

import { Logger } from './Logger';

vi.unmock('@/helpers/Logger/Logger');

describe('Logger', () => {
  const uuid = '12312312312asda';
  const game = 'game';
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ roomUuid: uuid, gameName: game, prefix: 'Префикс' });
  });

  it('Создается инстанс', () => {
    expect(logger).toBeDefined();
  });

  it('Записывает логи', async () => {
    const logFile = path.resolve(__dirname, game, uuid, 'all.log');
    const logAllFile = path.resolve(__dirname, 'all.log');
    const time = MOCKED_CURRENT_DATE.toLocaleString('ru', { timeZone: 'UTC' });

    logger.info('info');
    logger.error('error');
    logger.debug('debug');
    logger.warn('warn');
    await vi.advanceTimersToNextTimerAsync();
    expect(fs.readFileSync(logFile, 'utf8')).toContain(`[INFO] [UTC ${time}] [Игра: ${game}] [Комната: ${uuid}] [Префикс] info`);
    expect(fs.readFileSync(logFile, 'utf8')).toContain(`[ERROR] [UTC ${time}] [Игра: ${game}] [Комната: ${uuid}] [Префикс] error`);
    expect(fs.readFileSync(logFile, 'utf8')).toContain(`[DEBUG] [UTC ${time}] [Игра: ${game}] [Комната: ${uuid}] [Префикс] debug`);
    expect(fs.readFileSync(logFile, 'utf8')).toContain(`[WARN] [UTC ${time}] [Игра: ${game}] [Комната: ${uuid}] [Префикс] warn`);
    expect(fs.readFileSync(logAllFile, 'utf8')).toContain(`[INFO] [UTC ${time}] [Игра: ${game}] [Комната: ${uuid}] [Префикс] info`);
    expect(fs.readFileSync(logAllFile, 'utf8')).toContain(`[ERROR] [UTC ${time}] [Игра: ${game}] [Комната: ${uuid}] [Префикс] error`);
    expect(fs.readFileSync(logAllFile, 'utf8')).toContain(`[DEBUG] [UTC ${time}] [Игра: ${game}] [Комната: ${uuid}] [Префикс] debug`);
    expect(fs.readFileSync(logAllFile, 'utf8')).toContain(`[WARN] [UTC ${time}] [Игра: ${game}] [Комната: ${uuid}] [Префикс] warn`);
  });
});
