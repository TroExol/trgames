import { LucidShared } from '@trgames/shared';

const FIELD_READERS: Record<
  LucidShared.EConditionField,
  (player: LucidShared.TPlayer) => number
> = {
  [LucidShared.EConditionField.POSITION]: player => player.position,
  [LucidShared.EConditionField.RESOURCE]: player => player.resource,
};

const OPERATORS: Record<
  LucidShared.EConditionOperator,
  (left: number, right: number) => boolean
> = {
  [LucidShared.EConditionOperator.EQ]: (left, right) => left === right,
  [LucidShared.EConditionOperator.GT]: (left, right) => left > right,
  [LucidShared.EConditionOperator.GTE]: (left, right) => left >= right,
  [LucidShared.EConditionOperator.LT]: (left, right) => left < right,
  [LucidShared.EConditionOperator.LTE]: (left, right) => left <= right,
};

export const checkCondition = (
  player: LucidShared.TPlayer,
  condition: LucidShared.TCondition,
): boolean => {
  return OPERATORS[condition.operator](FIELD_READERS[condition.field](player), condition.value);
};
