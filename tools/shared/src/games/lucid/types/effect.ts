export enum EAtomKind {
  MOVE = 'MOVE',
  RESOURCE = 'RESOURCE',
  SKIP_TURN = 'SKIP_TURN',
  SWAP_WITH_FIRST = 'SWAP_WITH_FIRST',
}

export enum ETarget {
  ALL = 'ALL',
  FIRST = 'FIRST',
  LAST = 'LAST',
  SELF = 'SELF',
}

export interface TAtom {
  kind: EAtomKind;
  target: ETarget;
  // Смысл зависит от вида: клеток, единиц ресурса, пропускаемых ходов.
  // Допустимый диапазон у каждого вида свой, см. ATOM_RANGES в схеме валидации
  value: number;
}

// Условия могут смотреть только на запас ресурса и положение на треке.
// Пропуск хода намеренно исключён: событие, срабатывающее по-разному
// в зависимости от пропуска хода, непонятно игроку.
export enum EConditionField {
  POSITION = 'POSITION',
  RESOURCE = 'RESOURCE',
}

export enum EConditionOperator {
  EQ = 'EQ',
  GT = 'GT',
  GTE = 'GTE',
  LT = 'LT',
  LTE = 'LTE',
}

export interface TCondition {
  field: EConditionField;
  operator: EConditionOperator;
  value: number;
}

// Условие ровно одного уровня: вложенных не бывает
export interface TEffect {
  atoms: TAtom[];
  condition?: TCondition;
  otherwise?: TAtom[];
}

export interface TOption {
  text: string;
  // Порог кубика, с которого вариант удаётся. Без него вариант гарантированный
  threshold?: number;
  cost?: number;
  success: TEffect;
  failure?: TEffect;
}
