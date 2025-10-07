import type { Log } from '../Log';

export class LogGroup {
  public array: Log[] = [];

  constructor(logs?: Log[]) {
    if (logs) {
      this.array = logs;
    }
  }

  public get count(): number {
    return this.array.length;
  }

  public addLogToTop = (log: Log): void => {
    this.array.unshift(log);
  };

  public addLogToBottom = (log: Log): void => {
    this.array.push(log);
  };

  public clear = (): void => {
    this.array = [];
  };
}
