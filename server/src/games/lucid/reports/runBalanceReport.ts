import { measureParties } from '@/games/lucid/reports/balance';

const seeds = Array.from({ length: 20 }, (_, index) => `balance-${index + 1}`);

console.table(measureParties({ playerCounts: [2, 3, 4, 5, 6], seeds }));
