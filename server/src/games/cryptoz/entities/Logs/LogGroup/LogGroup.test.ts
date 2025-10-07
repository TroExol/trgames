import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { LogGroup } from './LogGroup';
import { Log } from '../Log';

describe('LogGroup', () => {
  let logGroup: LogGroup;

  beforeEach(() => {
    logGroup = new LogGroup();
  });

  it('Инстанс создается', () => {
    expect(logGroup).toBeInstanceOf(LogGroup);
  });

  it('Добавляет логи', () => {
    const log1 = new Log('message1');
    const log2 = new Log('message1');
    const log3 = new Log('message1');

    logGroup.addLogToTop(log1);
    expect(logGroup.count).toBe(1);
    logGroup.addLogToBottom(log2);
    expect(logGroup.count).toBe(2);
    logGroup.addLogToTop(log3);
    expect(logGroup.count).toBe(3);
  });

  it('Очищается', () => {
    const log1 = new Log('message1');
    const log2 = new Log('message1');
    const log3 = new Log('message1');

    logGroup.addLogToBottom(log1);
    logGroup.addLogToBottom(log2);
    logGroup.addLogToBottom(log3);

    logGroup.clear();

    expect(logGroup.count).toBe(0);
  });
});
