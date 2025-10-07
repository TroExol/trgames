import {
  describe,
  expect,
  it,
} from 'vitest';
import _ from 'lodash';

import { MOCKED_CURRENT_DATE } from '@/vitest/constants';

import { Log } from './index';

describe('Log', () => {
  it('format возвращает корректные значения', () => {
    const log = new Log('message');

    expect(_.omit(log.format(), 'uuid')).toEqual({ message: 'message', date: MOCKED_CURRENT_DATE.toISOString() });
  });
});
