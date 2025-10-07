import {
  describe,
  expect,
  it,
} from 'vitest';

import { i18n, t } from './index';

describe('i18n-js configuration', () => {
  it('Должен переводить простые ключи', () => {
    expect(t('cryptoz.logs.chaos', 'ru')).toBe('ХАОС!!!');
  });

  it('Должен переводить ключи с параметрами', () => {
    t('cryptoz.logs.playerRemoved', 'ru');
    expect(t('cryptoz.logs.playerRemoved', 'ru', { nickname: 'Участник1' }))
      .toBe('Участник Участник1 удален из игры');

    expect(t('cryptoz.logs.tookDamage', 'ru', { nickname: 'Участник1', count: 1 }))
      .toBe('Участнику Участник1 нанесли 1 урон');
    expect(t('cryptoz.logs.tookDamage', 'ru', { nickname: 'Участник1', count: 2 }))
      .toBe('Участнику Участник1 нанесли 2 урона');
    expect(t('cryptoz.logs.tookDamage', 'ru', { nickname: 'Участник1', count: 5 }))
      .toBe('Участнику Участник1 нанесли 5 урона');
    expect(t('cryptoz.logs.tookDamage', 'ru', { nickname: 'Участник1', count: 10 }))
      .toBe('Участнику Участник1 нанесли 10 урона');
    expect(t('cryptoz.logs.tookDamage', 'ru', { nickname: 'Участник1', count: 101 }))
      .toBe('Участнику Участник1 нанесли 101 урон');
  });

  it('Должен вернуть ключ если перевод не найден', () => {
    // @ts-expect-error TS2345 - проверка на отсутствие ключа
    expect(t('nonexistent.key', 'ru')).toBe('nonexistent key');
  });

  it('Должен обрабатывать отсутствующие параметры с хорошим форматом', () => {
    expect(t('cryptoz.logs.playerRemoved', 'ru')).toBe('Участник [missing "%{nickname}" value] удален из игры');
    expect(t('cryptoz.logs.tookDamage', 'ru', { nickname: 'Участник1' }))
      .toEqual({
        few: 'Участнику %{nickname} нанесли %{count} урона',
        many: 'Участнику %{nickname} нанесли %{count} урона',
        one: 'Участнику %{nickname} нанесли %{count} урон',
        other: 'Участнику %{nickname} нанесли %{count} урона',
      });
  });

  it('Должен работать с экземпляром i18n напрямую', () => {
    i18n.locale = 'ru';
    expect(i18n.t('cryptoz.logs.chaos')).toBe('ХАОС!!!');
  });

  it('Должен иметь правильный дефолтный язык', () => {
    expect(i18n.defaultLocale).toBe('ru');
  });
});
