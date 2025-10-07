import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AbstractTrigger } from './AbstractTrigger';

const triggerHandler = vi.fn();

class TestTrigger extends AbstractTrigger {
  constructor() {
    super('test', triggerHandler);
  }
}

describe('AbstractModifier', () => {
  let trigger: TestTrigger;

  beforeEach(() => {
    trigger = new TestTrigger();
  });

  it('Создается инстанс', () => {
    expect(trigger).toBeInstanceOf(TestTrigger);
  });

  it('Применяет триггер', () => {
    trigger.apply();
    expect(triggerHandler).toHaveBeenCalledTimes(1);
  });
});
