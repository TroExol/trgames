import type { CryptozShared } from '@trgames/shared';

import { makeAutoObservable } from 'mobx';

export class MessagesStore {
  public messages: CryptozShared.TMessage[] = [];
  public lastReadMessage: CryptozShared.TMessage | undefined;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public clear = (): void => {
    this.messages = [];
    this.lastReadMessage = undefined;
  };

  public updateMessages = (messages: CryptozShared.TMessage[]): void => {
    this.messages = messages;
  };

  public setLastReadMessage = (message: CryptozShared.TMessage): void => {
    this.lastReadMessage = message;
  };

  public get unreadMessages(): CryptozShared.TMessage[] {
    const firstNotReadIndex = this.lastReadMessage
      ? this.messages.findLastIndex(message => message.uuid === this.lastReadMessage?.uuid) + 1
      : 0;
    return this.messages.slice(firstNotReadIndex);
  };
}
