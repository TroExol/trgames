import { measureParties } from '@/games/lucid/reports/balance';

const seeds = Array.from({ length: 20 }, (_, index) => `balance-${index + 1}`);

const playerCounts = [2, 3, 4, 5, 6];

console.log('Без покупок');
console.table(measureParties({ playerCounts, seeds }));
console.log('С покупками');
console.table(measureParties({ playerCounts, seeds, buyer: true }));
