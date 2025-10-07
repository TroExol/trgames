import _ from 'lodash';

import type { NonVoidFunction, NonVoidReturnType } from '@/types/helpers';

import type { TObserverCallback } from './types';

export class FunctionResultObserver<T extends (() => ReturnType<T>) | (() => Promise<ReturnType<T>>)> {
  private currentResult: NonVoidReturnType<T> | undefined;
  private readonly func: T;
  private callback: TObserverCallback<NonVoidReturnType<T>>;
  private intervalMS: number;
  private interval: ReturnType<typeof setInterval> | undefined;

  constructor(func: NonVoidFunction<T>, callback: TObserverCallback<NonVoidReturnType<T>>, intervalMS: number) {
    this.callback = callback;
    this.func = func;
    this.intervalMS = intervalMS;
  }

  private readonly init = async () => {
    this.currentResult = await this.getFunctionResult();
    this.callback(undefined, this.currentResult);
  };

  private readonly getFunctionResult = async (): Promise<NonVoidReturnType<T>> => {
    return structuredClone(await this.func()) as NonVoidReturnType<T>;
  };

  public changeCallback(callback: typeof this.callback): void {
    this.callback = callback;
  }

  public stopObserve(): void {
    clearInterval(this.interval);
  }

  public startObserve(): void {
    this.interval = setInterval(() => {
      void (async () => {
        const newResult = await this.getFunctionResult();
        if (!_.isEqual(this.currentResult, newResult)) {
          this.callback(this.currentResult, newResult);
          this.currentResult = newResult;
        }
      })();
    }, this.intervalMS);
  }

  public changeIntervalMS(intervalMS: number): void {
    this.intervalMS = intervalMS;
    this.stopObserve();
    this.startObserve();
  }
}
