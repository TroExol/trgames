import type { CryptozShared } from '@trgames/shared';

import { makeAutoObservable } from 'mobx';

export class LogsStore {
  public logs: CryptozShared.TLog[] = [];
  public lastReadLog: CryptozShared.TLog | undefined;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public clear = (): void => {
    this.logs = [];
  };

  public updateLogs = (logs: CryptozShared.TLog[]): void => {
    this.logs = logs;
  };

  public setLastReadLog = (log: CryptozShared.TLog): void => {
    this.lastReadLog = log;
  };

  public get unreadLogs(): CryptozShared.TLog[] {
    const firstNotReadIndex = this.lastReadLog
      ? this.logs.findLastIndex(message => message.uuid === this.lastReadLog?.uuid) + 1
      : 0;
    return this.logs.slice(firstNotReadIndex);
  };
}
