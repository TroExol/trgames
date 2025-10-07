import type { CryptozShared } from '@trgames/shared';

import { v4 as uuidv4 } from 'uuid';

export class Log {
  private readonly uuid = uuidv4();
  private readonly date = new Date().toISOString();
  private readonly message: string;

  constructor(message: string) {
    this.message = message;
  }

  format(): CryptozShared.TLog {
    return {
      uuid: this.uuid,
      message: this.message,
      date: this.date,
    };
  }
}
