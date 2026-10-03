import type { THistoryEntry } from './types/state';

import {
  EAtomKind,
  EConditionField,
  EConditionOperator,
  ETarget,
  type TAtom,
  type TCondition,
  type TEffect,
  type TOptionView,
} from './types/effect';

// Настоящий минус, не дефис: дефис в подписи цифр читается хуже
const MINUS = '−';

const signed = (value: number): string => `${value >= 0 ? '+' : MINUS}${Math.abs(value)}`;

// Диапазон MOVE не выходит за ±4 (ATOM_RANGES) — «клетки» покрывает 2..4 целиком
const cellsWord = (absValue: number): string => (absValue === 1 ? 'клетка' : 'клетки');

// Диапазон SKIP_TURN — 1..2
const turnsPhrase = (value: number): string => (value === 1 ? 'пропуск хода' : `пропуск ${value} ходов`);

const TARGET_LABELS: Record<ETarget, string> = {
  [ETarget.ALL]: 'все',
  [ETarget.FIRST]: 'лидер',
  [ETarget.LAST]: 'отстающий',
  [ETarget.SELF]: 'ты',
};

// Действие атома без цели: используется и для карточки события (с общей
// подписью цели), и для строки в ленте (там цель — настоящий ник)
export const describeAtomAction = (atom: TAtom, resourceName: string): string => {
  switch (atom.kind) {
    case EAtomKind.MOVE:
      return atom.value === 0 ? 'на месте' : `${signed(atom.value)} ${cellsWord(Math.abs(atom.value))}`;
    case EAtomKind.RESOURCE:
      return `${resourceName} ${signed(atom.value)}`;
    case EAtomKind.SKIP_TURN:
      return turnsPhrase(atom.value);
    case EAtomKind.SWAP_WITH_FIRST:
      return 'меняется местами с лидером';
  }
};

// Описание атома с общей подписью цели (ты/лидер/отстающий/все) — для
// карточки события, где реальные игроки заранее не известны
export const describeAtom = (atom: TAtom, resourceName: string): string => {
  if (atom.kind === EAtomKind.SWAP_WITH_FIRST) {
    return 'ты меняешься местами с лидером';
  }

  return `${TARGET_LABELS[atom.target]}: ${describeAtomAction(atom, resourceName)}`;
};

const CONDITION_FIELD_LABELS: Record<EConditionField, (resourceName: string) => string> = {
  [EConditionField.POSITION]: () => 'клетка',
  [EConditionField.RESOURCE]: resourceName => resourceName,
};

const CONDITION_OPERATOR_SIGNS: Record<EConditionOperator, string> = {
  [EConditionOperator.EQ]: '=',
  [EConditionOperator.GT]: '>',
  [EConditionOperator.GTE]: '≥',
  [EConditionOperator.LT]: '<',
  [EConditionOperator.LTE]: '≤',
};

const describeCondition = (condition: TCondition, resourceName: string): string => {
  const field = CONDITION_FIELD_LABELS[condition.field](resourceName);
  const operator = CONDITION_OPERATOR_SIGNS[condition.operator];

  return `${field} ${operator} ${condition.value}`;
};

const describeAtoms = (atoms: TAtom[], resourceName: string): string => (
  atoms.map(atom => describeAtom(atom, resourceName)).join(', ')
);

// Полное описание эффекта для карточки события: атомы через запятую,
// при наличии условия — «если …: …, иначе: …» (иначе без otherwise — «ничего»)
export const describeEffect = (effect: TEffect, resourceName: string): string => {
  if (!effect.condition) {
    return describeAtoms(effect.atoms, resourceName);
  }

  const otherwise = effect.otherwise?.length ? describeAtoms(effect.otherwise, resourceName) : 'ничего';

  return `если ${describeCondition(effect.condition, resourceName)}: ${describeAtoms(effect.atoms, resourceName)}, иначе: ${otherwise}`;
};

// Строка истории клетки: «Ваня — «Вскрыть ящик ломом», выпало 5 из 4 — заряды +3».
// Используется и карточкой итога, и просмотром клетки — обе показывают уже
// случившееся, эффект берётся по сработавшей ветке записи
export const describeHistoryEntry = (entry: THistoryEntry, option: TOptionView, resourceName: string): string => {
  const rollPart = entry.roll !== undefined && option.threshold
    ? `, выпало ${entry.roll} из ${option.threshold}`
    : '';
  const effect = entry.branch === 'success' ? option.success : option.failure;
  const outcome = effect ? describeEffect(effect, resourceName) : 'ничего';

  return `${entry.nickname} — «${option.text}»${rollPart} — ${outcome}`;
};
