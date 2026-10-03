import type { TUsageReport } from '@/games/lucid/storage/db';

const formatUsd = (value: number): string => `$${value.toFixed(4)}`;
const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;
const formatSeconds = (ms: number): string => `${(ms / 1000).toFixed(1)}с`;
// До минут: секунды в дате читателю не нужны, а сортировка по строке
// совпадает с сортировкой по времени
const formatDateTime = (ms: number): string => new Date(ms).toISOString().slice(0, 16).replace('T', ' ');

const NO_DATA_MESSAGE = 'Данных пока нет';

// Печать — простой текст с русскими заголовками, без таблиц и выравнивания:
// это разовый отчёт для терминала, а не панель мониторинга
export const formatUsageReport = (report: TUsageReport): string => {
  if (!report.totals) {
    return NO_DATA_MESSAGE;
  }

  const { totals, byDay, byModel, recent } = report;
  const lines: string[] = [];

  lines.push('Итого:');
  lines.push(`  Генераций: ${totals.generations}`);
  lines.push(`  Вызовов: ${totals.calls}`);
  lines.push(`  Токены (вход/выход): ${totals.inputTokens} / ${totals.outputTokens}`);
  lines.push(`  Стоимость: ${formatUsd(totals.costUsd)}`);
  lines.push(`  Доля запасных партий: ${formatPercent(totals.fallbackShare)}`);
  lines.push(
    `  Время генерации (медиана / худшее): ${formatSeconds(totals.durationMedianMs)}`
    + ` / ${formatSeconds(totals.durationWorstMs)}`,
  );
  lines.push(`  Перегенераций: ${totals.retries}`);

  lines.push('');
  lines.push('По дням:');
  byDay.forEach(row => {
    lines.push(`  ${row.day}  генераций: ${row.generations}  ${formatUsd(row.costUsd)}`);
  });

  lines.push('');
  lines.push('По моделям:');
  byModel.forEach(row => {
    lines.push(
      `  ${row.model}  вызовов: ${row.calls}  ${formatUsd(row.costUsd)}`
      + `  среднее время: ${formatSeconds(row.avgDurationMs)}  доля ошибок: ${formatPercent(row.errorShare)}`,
    );
  });

  lines.push('');
  lines.push('Последние 10 генераций:');
  recent.forEach(row => {
    lines.push(
      `  ${formatDateTime(row.createdAt)}  ${row.worldName || '(без названия)'}  ${row.model}`
      + `  ${formatSeconds(row.durationMs)}  ${formatUsd(row.costUsd)}`
      + `  ${row.usedFallback ? 'запасная' : 'обычная'}`
      + `  платных: ${formatPercent(row.paidOptionShare)}`
      + `  против лидера: ${formatPercent(row.antiLeaderShare)}`
      + `  в помощь последнему: ${formatPercent(row.helpLastShare)}`
      + `  перегенераций: ${row.retriesCount}`,
    );
  });

  return lines.join('\n');
};
