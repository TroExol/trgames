import {
  describe,
  expect,
  it,
} from 'vitest';

import type { TUsageReport } from '@/games/lucid/storage/db';

import { formatUsageReport } from '@/games/lucid/reports/formatUsageReport';

describe('formatUsageReport', () => {
  it('на пустой базе печатает понятное сообщение, а не падает', () => {
    const report: TUsageReport = {
      totals: null,
      byDay: [],
      byModel: [],
      recent: [],
    };

    expect(formatUsageReport(report)).toBe('Данных пока нет');
  });

  it('печатает разделы с русскими заголовками и значениями из отчёта', () => {
    const report: TUsageReport = {
      totals: {
        generations: 3,
        calls: 5,
        inputTokens: 1_000,
        outputTokens: 2_000,
        costUsd: 0.1234,
        fallbackShare: 0.5,
        durationMedianMs: 1_500,
        durationWorstMs: 3_000,
        retries: 2,
      },
      byDay: [{ day: '2026-09-23', generations: 3, costUsd: 0.1234 }],
      byModel: [{
        model: 'deepseek/deepseek-v4.1-flash',
        calls: 5,
        costUsd: 0.1234,
        avgDurationMs: 800,
        errorShare: 0.2,
      }],
      recent: [{
        createdAt: Date.UTC(2026, 8, 23, 12, 0),
        worldName: 'Пиратская бухта',
        model: 'deepseek/deepseek-v4.1-flash',
        durationMs: 1_500,
        costUsd: 0.05,
        usedFallback: false,
        paidOptionShare: 0.4,
        antiLeaderShare: 0.3,
        helpLastShare: 0.2,
        retriesCount: 1,
      }],
    };

    const output = formatUsageReport(report);

    expect(output).toContain('Итого:');
    expect(output).toContain('Генераций: 3');
    expect(output).toContain('Стоимость: $0.1234');
    expect(output).toContain('Доля запасных партий: 50%');
    expect(output).toContain('По дням:');
    expect(output).toContain('2026-09-23');
    expect(output).toContain('По моделям:');
    expect(output).toContain('deepseek/deepseek-v4.1-flash');
    expect(output).toContain('доля ошибок: 20%');
    expect(output).toContain('Последние 10 генераций:');
    expect(output).toContain('Пиратская бухта');
    expect(output).toContain('против лидера: 30%');
  });

  it('генерацию без названия мира подписывает как безымянную, а не пустой строкой', () => {
    const report: TUsageReport = {
      totals: {
        generations: 1,
        calls: 1,
        inputTokens: 10,
        outputTokens: 20,
        costUsd: 0.01,
        fallbackShare: 0,
        durationMedianMs: 100,
        durationWorstMs: 100,
        retries: 0,
      },
      byDay: [],
      byModel: [],
      recent: [{
        createdAt: Date.now(),
        worldName: '',
        model: 'test/model',
        durationMs: 100,
        costUsd: 0.01,
        usedFallback: true,
        paidOptionShare: 0,
        antiLeaderShare: 0,
        helpLastShare: 0,
        retriesCount: 0,
      }],
    };

    expect(formatUsageReport(report)).toContain('(без названия)');
  });
});
