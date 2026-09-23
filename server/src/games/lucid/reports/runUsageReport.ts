import { createStorage } from '@/games/lucid/storage/db';
import { formatUsageReport } from '@/games/lucid/reports/formatUsageReport';
import { STORAGE_PATH } from '@/games/lucid/init';

// Тот же файл базы, что открывает сервер (см. STORAGE_PATH в init.ts):
// отчёт читает то, что накопилось за реальную работу игры
const storage = createStorage(STORAGE_PATH);

console.log(formatUsageReport(storage.usageReport()));
