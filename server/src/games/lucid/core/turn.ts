import { LucidShared } from '@trgames/shared';

export const freshTurn = (): LucidShared.TTurn => ({
  step: LucidShared.ETurnStep.START,
  fired: [],
  extraTurn: false,
});
