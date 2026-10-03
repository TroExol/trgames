import type { LucidShared } from '@trgames/shared';

export interface TRandomResult<T> {
  value: T;
  state: LucidShared.TRandomState;
}

// Превращает строку в 32-битное число, чтобы сидом мог быть любой текст
const hashSeed = (seed: string): number => {
  let hash = 0x811c9dc5;

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
};

export const createRandom = (seed: string): LucidShared.TRandomState => ({
  seed: hashSeed(seed),
});

// mulberry32: короткий генератор с хорошим распределением и состоянием в одном числе
const next = (state: LucidShared.TRandomState): TRandomResult<number> => {
  const seed = (state.seed + 0x6d2b79f5) >>> 0;
  let value = seed;

  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  value = ((value ^ (value >>> 14)) >>> 0) / 4294967296;

  return { value, state: { seed } };
};

export const randomInt = (
  state: LucidShared.TRandomState,
  min: number,
  max: number,
): TRandomResult<number> => {
  const result = next(state);

  return {
    value: min + Math.floor(result.value * (max - min + 1)),
    state: result.state,
  };
};

export const rollDie = (state: LucidShared.TRandomState): TRandomResult<number> => {
  return randomInt(state, 1, 6);
};

export const shuffle = <T>(
  state: LucidShared.TRandomState,
  items: T[],
): TRandomResult<T[]> => {
  const result = [...items];
  let current = state;

  for (let i = result.length - 1; i > 0; i--) {
    const picked = randomInt(current, 0, i);
    current = picked.state;
    [result[i], result[picked.value]] = [result[picked.value], result[i]];
  }

  return { value: result, state: current };
};
