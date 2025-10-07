import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { TurnEndedTrigger } from '@/games/cryptoz/customTriggers/TurnEndedTrigger';

import { TriggerGroup } from './TriggerGroup';

describe('TriggerGroup', () => {
  let triggerGroup: TriggerGroup<TurnEndedTrigger>;

  beforeEach(() => {
    triggerGroup = new TriggerGroup();
  });

  it('Инстанс создается', () => {
    expect(triggerGroup).toBeInstanceOf(TriggerGroup);
  });

  it('Добавляет триггеры', () => {
    const trigger1 = new TurnEndedTrigger('1', () => {}, { order: 2 });
    const trigger2 = new TurnEndedTrigger('2', () => {});
    const trigger3 = new TurnEndedTrigger('3', () => {}, { order: 1 });

    triggerGroup.addTrigger(trigger1);
    expect(triggerGroup.count).toBe(1);
    triggerGroup.addTrigger(trigger2);
    triggerGroup.addTrigger(trigger3);
    expect(triggerGroup.count).toBe(3);
    expect(triggerGroup.array).toEqual([trigger2, trigger3, trigger1]);
  });

  it('Удаляет триггеры', () => {
    const trigger1 = new TurnEndedTrigger('1', () => {}, { order: 2 });
    const trigger2 = new TurnEndedTrigger('2', () => {});
    const trigger3 = new TurnEndedTrigger('3', () => {}, { order: 1 });

    triggerGroup.addTrigger(trigger1);
    triggerGroup.addTrigger(trigger2);
    triggerGroup.addTrigger(trigger3);

    expect(triggerGroup.removeTrigger(trigger3)).toBeTruthy();
    expect(triggerGroup.count).toBe(2);
    expect(triggerGroup.array).toEqual([trigger2, trigger1]);
    expect(triggerGroup.removeTrigger(trigger3)).toBeFalsy();
    expect(triggerGroup.count).toBe(2);
  });

  it('Удаляет триггеры по id', () => {
    const trigger1 = new TurnEndedTrigger('1', () => {}, { order: 2 });
    const trigger2 = new TurnEndedTrigger('2', () => {});
    const trigger3 = new TurnEndedTrigger('3', () => {}, { order: 1 });

    triggerGroup.addTrigger(trigger1);
    triggerGroup.addTrigger(trigger2);
    triggerGroup.addTrigger(trigger3);

    expect(triggerGroup.removeTriggerById('3')).toBeTruthy();
    expect(triggerGroup.count).toBe(2);
    expect(triggerGroup.array).toEqual([trigger2, trigger1]);
    expect(triggerGroup.removeTriggerById('3')).toBeFalsy();
    expect(triggerGroup.count).toBe(2);
  });

  it('Получение триггеров работает корректно', () => {
    const trigger1 = new TurnEndedTrigger('1', () => {}, { order: 2 });
    const trigger2 = new TurnEndedTrigger('2', () => {});

    expect(triggerGroup.getTrigger(trigger1)).toBeNull();
    expect(triggerGroup.getTriggerById('1')).toBeNull();

    triggerGroup.addTrigger(trigger1);
    triggerGroup.addTrigger(trigger2);

    expect(triggerGroup.getTrigger(trigger1)).toBe(trigger1);
    expect(triggerGroup.getTriggerById('1')).toBe(trigger1);
  });

  it('Получение количества работает корректно', () => {
    const trigger1 = new TurnEndedTrigger('1', () => {}, { order: 2 });
    const trigger2 = new TurnEndedTrigger('2', () => {});

    expect(triggerGroup.count).toBe(0);

    triggerGroup.addTrigger(trigger1);
    triggerGroup.addTrigger(trigger2);

    expect(triggerGroup.count).toBe(2);
  });

  it('Очищается', () => {
    const trigger1 = new TurnEndedTrigger('1', () => {}, { order: 2 });
    const trigger2 = new TurnEndedTrigger('2', () => {});

    triggerGroup.addTrigger(trigger1);
    triggerGroup.addTrigger(trigger2);

    triggerGroup.clear();

    expect(triggerGroup.count).toBe(0);
  });

  it('Возвращает список id', () => {
    const trigger1 = new TurnEndedTrigger('1', () => {}, { order: 2 });
    const trigger2 = new TurnEndedTrigger('2', () => {});

    expect(triggerGroup.ids).toEqual([]);

    triggerGroup.addTrigger(trigger1);
    triggerGroup.addTrigger(trigger2);

    expect(triggerGroup.ids).toEqual(['2', '1']);
  });

  it('Применяет триггеры', () => {
    let str = '';

    const trigger1 = new TurnEndedTrigger('1', () => {
      str += '1';
    }, { order: 2 });
    const trigger2 = new TurnEndedTrigger('2', () => {
      str += '2';
    });
    const trigger3 = new TurnEndedTrigger('3', () => {
      str += '3';
    }, { order: 1 });
    const trigger4 = new TurnEndedTrigger('4', () => {
      str += '4';
    }, { order: 1 });
    const trigger5 = new TurnEndedTrigger('5', () => {
      str += '5';
    });

    triggerGroup.addTrigger(trigger1);
    triggerGroup.addTrigger(trigger2);
    triggerGroup.addTrigger(trigger3);
    triggerGroup.addTrigger(trigger4);
    triggerGroup.addTrigger(trigger5);

    triggerGroup.apply();

    expect(str).toBe('25341');
  });
});
