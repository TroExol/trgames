export const SAFE_THRESHOLD = 5;

export const SAFE_BONUS_COSTS = [0, 5, 10];

export const safeNeed = (bonus: number): number => SAFE_THRESHOLD - bonus;
