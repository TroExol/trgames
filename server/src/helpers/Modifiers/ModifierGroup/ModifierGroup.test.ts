import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { HealModifier } from '@/games/cryptoz/customModifiers/HealModifier';

import { ModifierGroup } from './ModifierGroup';

describe('ModifierGroup', () => {
  let modifierGroup: ModifierGroup<HealModifier>;

  beforeEach(() => {
    modifierGroup = new ModifierGroup();
  });

  it('Инстанс создается', () => {
    expect(modifierGroup).toBeInstanceOf(ModifierGroup);
  });

  it('Добавляет модификаторы', () => {
    const modifier1 = new HealModifier('1', count => count + 1, { order: 2 });
    const modifier2 = new HealModifier('2', count => count + 1);
    const modifier3 = new HealModifier('3', count => count + 1, { order: 1 });

    modifierGroup.addModifier(modifier1);
    expect(modifierGroup.count).toBe(1);
    modifierGroup.addModifier(modifier2);
    modifierGroup.addModifier(modifier3);
    expect(modifierGroup.count).toBe(3);
    expect(modifierGroup.array).toEqual([modifier2, modifier3, modifier1]);
  });

  it('Удаляет модификаторы', () => {
    const modifier1 = new HealModifier('1', count => count + 1, { order: 2 });
    const modifier2 = new HealModifier('2', count => count + 1);
    const modifier3 = new HealModifier('3', count => count + 1, { order: 1 });

    modifierGroup.addModifier(modifier1);
    modifierGroup.addModifier(modifier2);
    modifierGroup.addModifier(modifier3);

    expect(modifierGroup.removeModifier(modifier3)).toBeTruthy();
    expect(modifierGroup.count).toBe(2);
    expect(modifierGroup.array).toEqual([modifier2, modifier1]);
    expect(modifierGroup.removeModifier(modifier3)).toBeFalsy();
    expect(modifierGroup.count).toBe(2);
  });

  it('Удаляет модификаторы по id', () => {
    const modifier1 = new HealModifier('1', count => count + 1, { order: 2 });
    const modifier2 = new HealModifier('2', count => count + 1);
    const modifier3 = new HealModifier('3', count => count + 1, { order: 1 });

    modifierGroup.addModifier(modifier1);
    modifierGroup.addModifier(modifier2);
    modifierGroup.addModifier(modifier3);

    expect(modifierGroup.removeModifierById('3')).toBeTruthy();
    expect(modifierGroup.count).toBe(2);
    expect(modifierGroup.array).toEqual([modifier2, modifier1]);
    expect(modifierGroup.removeModifierById('3')).toBeFalsy();
    expect(modifierGroup.count).toBe(2);
  });

  it('Получение модификаторов работает корректно', () => {
    const modifier1 = new HealModifier('1', count => count + 1, { order: 2 });
    const modifier2 = new HealModifier('2', count => count + 1);

    expect(modifierGroup.getModifier(modifier1)).toBeNull();
    expect(modifierGroup.getModifierById('1')).toBeNull();

    modifierGroup.addModifier(modifier1);
    modifierGroup.addModifier(modifier2);

    expect(modifierGroup.getModifier(modifier1)).toBe(modifier1);
    expect(modifierGroup.getModifierById('1')).toBe(modifier1);
  });

  it('Получение количества работает корректно', () => {
    const modifier1 = new HealModifier('1', count => count + 1, { order: 2 });
    const modifier2 = new HealModifier('2', count => count + 1);

    expect(modifierGroup.count).toBe(0);

    modifierGroup.addModifier(modifier1);
    modifierGroup.addModifier(modifier2);

    expect(modifierGroup.count).toBe(2);
  });

  it('Очищается', () => {
    const modifier1 = new HealModifier('1', count => count + 1, { order: 2 });
    const modifier2 = new HealModifier('2', count => count + 1);

    modifierGroup.addModifier(modifier1);
    modifierGroup.addModifier(modifier2);

    modifierGroup.clear();

    expect(modifierGroup.count).toBe(0);
  });

  it('Возвращает список id', () => {
    const modifier1 = new HealModifier('1', count => count + 1, { order: 2 });
    const modifier2 = new HealModifier('2', count => count + 1);

    expect(modifierGroup.ids).toEqual([]);

    modifierGroup.addModifier(modifier1);
    modifierGroup.addModifier(modifier2);

    expect(modifierGroup.ids).toEqual(['2', '1']);
  });

  it('Применяет модификаторы', () => {
    const modifier1 = new HealModifier('1', count => count + 1, { order: 2 });
    const modifier2 = new HealModifier('2', count => count + 2);
    const modifier3 = new HealModifier('3', count => count * 2, { order: 1 });

    modifierGroup.addModifier(modifier1);
    modifierGroup.addModifier(modifier2);
    modifierGroup.addModifier(modifier3);

    expect(modifierGroup.apply(1)).toBe(7);
  });
});
