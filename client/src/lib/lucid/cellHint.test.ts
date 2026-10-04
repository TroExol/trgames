import {
  describe,
  expect,
  it,
} from 'vitest';
import { LucidShared } from '@trgames/shared';

import { cellHint } from './cellHint';

const ECellType = LucidShared.ECellType;
const ELaw = LucidShared.ELaw;

const makeG = (laws: (LucidShared.ELaw | null)[]) => ({
  cardNames: undefined,
  cards: { hands: {}, lawDraw: [], laws, shopOffer: [] },
  theme: { resourceName: 'заряды' },
}) as unknown as Parameters<typeof cellHint>[1];

const cellOf = (type: LucidShared.ECellType, portal?: LucidShared.TPortal): LucidShared.TCell =>
  ({ id: 1, next: [], portal, type });

describe('cellHint', () => {
  const G = makeG([ELaw.GREEN_RESOURCE, ELaw.RED_BAD, null]);

  it('события, закона, пустой, старта', () => {
    expect(cellHint(cellOf(ECellType.EVENT), G)).toBe('Событие: откроется, когда кто-то остановится здесь');
    expect(cellHint(cellOf(ECellType.LAW), G)).toBe('Закон: тянешь два закона, один вводишь на стол');
    expect(cellHint(cellOf(ECellType.EMPTY), G)).toBe('Пустая: ничего');
    expect(cellHint(cellOf(ECellType.START), G)).toBe('Старт');
  });

  it('лавка берёт цену и название ресурса', () => {
    expect(cellHint(cellOf(ECellType.SHOP), G)).toBe(
      `Лавка: три карты на выбор, одна за ${LucidShared.SHOP_PRICE}`,
    );
  });

  it('портал показывает номер пары как на поле', () => {
    expect(cellHint(cellOf(ECellType.PORTAL, { pair: 1, to: 5 }), G)).toBe(
      'Портал: переносит на парную клетку, пара 2',
    );
  });

  it('финиш берёт порог сейфа', () => {
    expect(cellHint(cellOf(ECellType.FINISH), G)).toBe(
      `Финиш: сейф открывается броском ${LucidShared.SAFE_THRESHOLD}+`,
    );
  });

  it('зелёная и красная перечисляют законы своего цвета', () => {
    expect(cellHint(cellOf(ECellType.GREEN), G)).toBe(
      'Зелёная: «Урожай» — заряды +5',
    );
    expect(cellHint(cellOf(ECellType.RED), G)).toBe(
      'Красная: «Дурная примета» — разыграй случайную беду',
    );
  });

  it('без законов цвета — ничего не даёт', () => {
    expect(cellHint(cellOf(ECellType.GREEN), makeG([ELaw.RED_BAD]))).toBe('Зелёная: сейчас ничего не даёт');
    expect(cellHint(cellOf(ECellType.RED), makeG([null, null, null]))).toBe('Красная: сейчас ничего не даёт');
  });
});
