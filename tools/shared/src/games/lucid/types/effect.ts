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

export type TAtom = {
  kind: EAtomKind;
  target: ETarget;
  // Смысл зависит от вида: клеток, единиц ресурса, пропускаемых ходов.
  // Допустимый диапазон у каждого вида свой, см. ATOM_RANGES в схеме валидации
  value: number;
};

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

export type TCondition = {
  field: EConditionField;
  operator: EConditionOperator;
  value: number;
};

// Условие ровно одного уровня: вложенных не бывает
export type TEffect = {
  atoms: TAtom[];
  condition?: TCondition;
  otherwise?: TAtom[];
};

export type TOption = {
  text: string;
  // Порог кубика, с которого вариант удаётся. Без него вариант гарантированный
  threshold?: number;
  cost?: number;
  success: TEffect;
  failure?: TEffect;
};
