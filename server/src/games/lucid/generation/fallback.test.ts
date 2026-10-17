import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import {
  cardNameSchema,
  eventSchema,
  worldSchema,
} from '@/games/lucid/generation/schema';
import { PROMPT_CARD_IDS } from '@/games/lucid/generation/prompt';
import { loadFallbackContent } from '@/games/lucid/generation/fallback';
import { computeContentMetrics } from '@/games/lucid/generation/contentMetrics';
import { buildTrack, eventCellIds } from '@/games/lucid/core/track';
import { createRandom } from '@/games/lucid/core/random';

// Реальные номера клеток событий для конкретного числа игроков — тем же способом,
// каким их строит setupParty (сид трека всегда `${seed}:track`)
const trackEventCellIds = (playerCount: number, seed = 'fallback'): number[] =>
  eventCellIds(buildTrack({ random: createRandom(`${seed}:track`), playerCount }));

const WHOLE_POOL = Array.from({ length: 48 }, (_, index) => index + 1);

describe('loadFallbackContent', () => {
  it('запасная тема проходит валидацию', () => {
    const { theme } = loadFallbackContent(trackEventCellIds(6), 'fallback');

    expect(worldSchema.safeParse({ theme }).success).toBe(true);
  });

  it('каждое событие пула проходит валидацию', () => {
    const { events } = loadFallbackContent(WHOLE_POOL, 'fallback');

    expect(Object.values(events)).toHaveLength(48);
    Object.values(events).forEach(event => {
      expect(eventSchema.safeParse(event).success).toBe(true);
    });
  });

  it('тексты пула короткие: событие до 140 символов, вариант до 50', () => {
    const { events } = loadFallbackContent(WHOLE_POOL, 'fallback');

    Object.values(events).forEach(event => {
      expect(event.text.length).toBeLessThanOrEqual(140);
      event.options.forEach(option => expect(option.text.length).toBeLessThanOrEqual(50));
    });
  });

  it('пул держит целевые доли: платных около трети, бед около четверти', () => {
    const metrics = computeContentMetrics(loadFallbackContent(WHOLE_POOL, 'fallback'));

    expect(metrics.paidOptionShare).toBeCloseTo(1 / 3, 1);
    expect(metrics.calamityShare).toBeCloseTo(1 / 4, 1);
  });

  it('в пуле есть варианты с целью CHOSEN: 5–6 событий', () => {
    const { events } = loadFallbackContent(WHOLE_POOL, 'fallback');
    const chosen = Object.values(events).filter(event => event.options.some(LucidShared.optionNeedsTarget));

    expect(chosen.length).toBeGreaterThanOrEqual(5);
    expect(chosen.length).toBeLessThanOrEqual(6);
  });

  it('события покрывают ровно переданные клетки — без лишних и без пропусков', () => {
    // В игру попадает только часть пула — на любой длине трека раскладка обязана сойтись
    [6, 2].forEach(playerCount => {
      const cellIds = trackEventCellIds(playerCount);
      const { events } = loadFallbackContent(cellIds, 'fallback');

      expect(Object.keys(events).map(Number).sort((a, b) => a - b)).toEqual(
        [...cellIds].sort((a, b) => a - b),
      );
    });
  });

  it('ключ словаря совпадает с полем cellId события', () => {
    const { events } = loadFallbackContent(trackEventCellIds(6), 'fallback');

    Object.entries(events).forEach(([cellId, event]) => {
      expect(Number(cellId)).toBe(event.cellId);
    });
  });

  it('один сид даёт одну и ту же раскладку', () => {
    const cellIds = trackEventCellIds(6);

    expect(loadFallbackContent(cellIds, 'same')).toEqual(loadFallbackContent(cellIds, 'same'));
  });

  it('разные сиды дают разную раскладку', () => {
    const cellIds = trackEventCellIds(6);

    expect(loadFallbackContent(cellIds, 'seed-a')).not.toEqual(loadFallbackContent(cellIds, 'seed-b'));
  });

  it('у каждой ветки есть строка исхода до 45 знаков', () => {
    const { events } = loadFallbackContent(WHOLE_POOL, 'fallback');

    Object.values(events).forEach(event => event.options.forEach(option => {
      [option.success, option.failure].forEach(effect => {
        if (effect) {
          expect(effect.text?.length).toBeGreaterThan(0);
          expect(effect.text?.length).toBeLessThanOrEqual(45);
        }
      });
    }));
  });

  it('в строках исхода нет цели', () => {
    const { events } = loadFallbackContent(WHOLE_POOL, 'fallback');
    const words = ['ты', 'тебя', 'тебе', 'тобой', 'лидер\\p{L}*', 'отстающ\\p{L}*', 'кто-то', 'все', 'всех', 'всем', 'всеми',
      'ходящ\\p{L}*', 'выбранн\\p{L}*', 'игрок\\p{L}*'];
    const target = new RegExp(`(?<![а-яё])(${words.join('|')})(?![а-яё])`, 'iu');

    Object.values(events).forEach(event => event.options.forEach(option => {
      [option.success, option.failure].forEach(effect => {
        expect(effect?.text ?? '').not.toMatch(target);
      });
    }));
  });

  it('названия карт есть у всех 25 карт и проходят валидацию', () => {
    const { cardNames } = loadFallbackContent(WHOLE_POOL, 'fallback');

    expect(PROMPT_CARD_IDS).toHaveLength(25);
    expect(Object.keys(cardNames ?? {}).sort()).toEqual([...PROMPT_CARD_IDS].sort());
    PROMPT_CARD_IDS.forEach((id, index) => {
      expect(cardNameSchema.safeParse({ id: `card${index + 1}`, ...cardNames?.[id] }).success).toBe(true);
    });
  });

  it('названия событий в пуле не повторяются', () => {
    const titles = Object.values(loadFallbackContent(WHOLE_POOL, 'fallback').events).map(event => event.title);

    expect(new Set(titles).size).toBe(titles.length);
  });
});
