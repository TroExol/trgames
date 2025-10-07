import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { FunctionResultObserver } from './FunctionResultObserver';

vi.unmock('@/helpers/FunctionResultObserver');

describe('AbstractObserver', () => {
  it('constructor корректно создается', async () => {
    const func = () => 1;
    const callback = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback, 1000);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      expect(observer).toBeInstanceOf(FunctionResultObserver);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(undefined, 1);
    } finally {
      observer?.stopObserve();
    }
  });

  it('Отрабатывает callback при изменении объекта', async () => {
    const result = { a: 1 };
    const func = () => result;
    const callback = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback, 10);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      result.a = 2;
      await vi.advanceTimersToNextTimerAsync();
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(2, { a: 1 }, { a: 2 });
    } finally {
      observer?.stopObserve();
    }
  });

  it('Не отрабатывает callback, если объект не изменился', async () => {
    const result = { a: 1 };
    const func = () => result;
    const callback = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback, 10);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      vi.advanceTimersByTime(10);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(undefined, { a: 1 });
    } finally {
      observer?.stopObserve();
    }
  });

  it('Отрабатывает callback при изменении массива', async () => {
    const result = [1];
    const func = () => result;
    const callback = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback, 10);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      result.push(2);
      await vi.advanceTimersToNextTimerAsync();
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(2, [1], [1, 2]);
    } finally {
      observer?.stopObserve();
    }
  });

  it('Не отрабатывает callback, если массив не изменился', async () => {
    const result = [1];
    const func = () => result;
    const callback = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback, 10);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      vi.advanceTimersByTime(10);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(undefined, [1]);
    } finally {
      observer?.stopObserve();
    }
  });

  it('Отрабатывает callback при изменении примитива', async () => {
    let result = 1;
    const func = () => result;
    const callback = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback, 10);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      result = 2;
      await vi.advanceTimersToNextTimerAsync();
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(2, 1, 2);
    } finally {
      observer?.stopObserve();
    }
  });

  it('Не отрабатывает callback, если примитив не изменился', async () => {
    const func = () => 1;
    const callback = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback, 10);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      vi.advanceTimersByTime(10);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(undefined, 1);
    } finally {
      observer?.stopObserve();
    }
  });

  it('Останавливает наблюдение', async () => {
    let result = 1;
    const func = () => result;
    const callback = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback, 10);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      observer.stopObserve();
      result = 2;
      vi.advanceTimersByTime(10);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(undefined, 1);
    } finally {
      observer?.stopObserve();
    }
  });

  it('Запускает наблюдение', async () => {
    let result = 1;
    const func = () => result;
    const callback = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback, 10);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      observer.stopObserve();
      result = 2;
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      vi.advanceTimersByTime(10);
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(2, 1, 2);
    } finally {
      observer?.stopObserve();
    }
  });

  it('Меняет колбэк', async () => {
    let result = 1;
    const func = () => result;
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback1, 10);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      observer.changeCallback(callback2);
      result = 2;
      await vi.advanceTimersToNextTimerAsync();
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback1).toHaveBeenCalledWith(undefined, 1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledWith(1, 2);
    } finally {
      observer?.stopObserve();
    }
  });

  it('Меняет интервал', async () => {
    let result = 1;
    const func = () => result;
    const callback = vi.fn();
    let observer: FunctionResultObserver<typeof func> | undefined;

    try {
      observer = new FunctionResultObserver(func, callback, 99999);
      observer.startObserve();
      await vi.advanceTimersToNextTimerAsync();
      observer.changeIntervalMS(10);
      result = 2;
      await vi.advanceTimersToNextTimerAsync();
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(2, 1, 2);
    } finally {
      observer?.stopObserve();
    }
  });
});
