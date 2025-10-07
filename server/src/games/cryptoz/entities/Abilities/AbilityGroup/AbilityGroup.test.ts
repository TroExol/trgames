import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { Ability2 } from '@/games/cryptoz/entities/Abilities/customAbilities/Ability2';

import { EAbilityGroupType } from './types';
import { AbilityGroup } from './AbilityGroup';

describe('AbilityGroup', () => {
  let abilityGroup: AbilityGroup<EAbilityGroupType.ANY>;

  beforeEach(() => {
    abilityGroup = new AbilityGroup(EAbilityGroupType.ANY);
  });

  it('Инстанс создается', () => {
    expect(abilityGroup).toBeInstanceOf(AbilityGroup);
  });

  it('Добавляет способности', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();
    const ability3 = new Ability2();

    abilityGroup.addAbilityToTop(ability1);
    expect(abilityGroup.count).toBe(1);
    abilityGroup.addAbilityToBottom(ability2);
    abilityGroup.addAbilityToTop(ability3);
    expect(abilityGroup.count).toBe(3);
  });

  it('Удаляет способности', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();

    abilityGroup.addAbilityToBottom(ability1);
    abilityGroup.addAbilityToBottom(ability2);

    expect(abilityGroup.removeAbility(ability1)).toBe(ability1);
    expect(abilityGroup.count).toBe(1);
    expect(abilityGroup.getAbility(ability1)).toBeNull();
    expect(abilityGroup.getAbility(ability2)).toBe(ability2);
    expect(abilityGroup.removeAbility(ability1)).toBeNull();
    expect(abilityGroup.count).toBe(1);
  });

  it('Удаляет способности снизу', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();
    const ability3 = new Ability2();

    abilityGroup.addAbilityToTop(ability1);
    abilityGroup.addAbilityToTop(ability2);
    abilityGroup.addAbilityToTop(ability3);

    expect(abilityGroup.removeAbilitiesFromTop(2).array).toEqual([ability2, ability3]);
    expect(abilityGroup.count).toBe(1);
    expect(abilityGroup.getAbility(ability1)).toBe(ability1);
    expect(abilityGroup.getAbility(ability2)).toBeNull();
    expect(abilityGroup.getAbility(ability3)).toBeNull();
    expect(abilityGroup.removeAbilitiesFromTop(2).array).toEqual([ability1]);
    expect(abilityGroup.count).toBe(0);
  });

  it('Удаляет способности сверху', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();
    const ability3 = new Ability2();

    abilityGroup.addAbilityToBottom(ability1);
    abilityGroup.addAbilityToBottom(ability2);
    abilityGroup.addAbilityToBottom(ability3);

    expect(abilityGroup.removeAbilitiesFromBottom(2).array).toEqual([ability3, ability2]);
    expect(abilityGroup.count).toBe(1);
    expect(abilityGroup.getAbility(ability1)).toBe(ability1);
    expect(abilityGroup.getAbility(ability2)).toBeNull();
    expect(abilityGroup.getAbility(ability3)).toBeNull();
    expect(abilityGroup.removeAbilitiesFromBottom(2).array).toEqual([ability1]);
    expect(abilityGroup.count).toBe(0);
  });

  it('Удаляет способности по id', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();

    abilityGroup.addAbilityToBottom(ability1);
    abilityGroup.addAbilityToBottom(ability2);

    expect(abilityGroup.removeAbilitiesById(2).count).toBe(2);
    expect(abilityGroup.count).toBe(0);
    expect(abilityGroup.removeAbilitiesById(2).count).toBe(0);
    expect(abilityGroup.count).toBe(0);
  });

  it('Перемешивает способности', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();

    abilityGroup.shuffle();
    expect(abilityGroup.array).toEqual([]);

    abilityGroup.addAbilityToBottom(ability1);
    abilityGroup.shuffle();
    expect(abilityGroup.array).toEqual([ability1]);

    abilityGroup.addAbilityToBottom(ability2);
    abilityGroup.shuffle();
    expect(abilityGroup.count).toBe(2);
  });

  it('Перемешивает способности, не мутируя исходную группу', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();

    const shuffled1 = abilityGroup.toShuffle();
    expect(abilityGroup.array).toEqual([]);
    expect(shuffled1.array).toEqual([]);
    expect(abilityGroup).not.toBe(shuffled1);

    abilityGroup.addAbilityToBottom(ability1);
    const shuffled2 = abilityGroup.toShuffle();
    expect(abilityGroup.array).toEqual([ability1]);
    expect(shuffled2.array).toEqual([ability1]);

    abilityGroup.addAbilityToBottom(ability2);
    const shuffled3 = abilityGroup.toShuffle();
    expect(abilityGroup.count).toBe(2);
    expect(abilityGroup.array).toEqual([ability2, ability1]);
    expect(shuffled3.count).toBe(2);
  });

  it('Получение способностей работает корректно', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();

    expect(abilityGroup.getAbility(ability1)).toBeNull();
    expect(abilityGroup.randomAbility).toBeNull();
    expect(abilityGroup.getAbilitiesById(1).array).toEqual([]);

    abilityGroup.addAbilityToBottom(ability1);
    abilityGroup.addAbilityToBottom(ability2);

    expect(abilityGroup.getAbility(ability1)).toBe(ability1);
    expect(abilityGroup.getAbilitiesById(2).array).toEqual([ability2, ability1]);
    expect(abilityGroup.getAbilitiesExceptAbility(ability2).array).toEqual([ability1]);
    expect(abilityGroup.array.includes(abilityGroup.randomAbility!)).toBeTruthy();
    expect(abilityGroup.getAbilityByUuid(ability1.uuid)).toBe(ability1);
    expect(abilityGroup.getAbilityByUuid('asd')).toBeNull();
    expect(abilityGroup.getAbilityById(2)).toBe(ability2);
  });

  it('Получение количества работает корректно', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();

    expect(abilityGroup.getCountAbilitiesById(2)).toBe(0);

    abilityGroup.addAbilityToBottom(ability1);
    abilityGroup.addAbilityToBottom(ability2);

    expect(abilityGroup.getCountAbilitiesById(2)).toBe(2);
    expect(abilityGroup.count).toBe(2);
  });

  it('Очищается', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();

    abilityGroup.addAbilityToBottom(ability1);
    abilityGroup.addAbilityToBottom(ability2);

    abilityGroup.clear();

    expect(abilityGroup.count).toBe(0);
  });

  it('Возвращает список id', () => {
    const ability1 = new Ability2();
    const ability2 = new Ability2();
    const ability3 = new Ability2();

    expect(abilityGroup.ids).toEqual([]);

    abilityGroup.addAbilityToBottom(ability1);
    abilityGroup.addAbilityToBottom(ability2);
    abilityGroup.addAbilityToBottom(ability3);

    expect(abilityGroup.ids).toEqual([2, 2, 2]);
  });
});
