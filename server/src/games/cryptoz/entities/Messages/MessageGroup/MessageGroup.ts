import type { Message } from '../Message';

export class MessageGroup {
  public array: Message[] = [];

  constructor(messages?: Message[]) {
    if (messages) {
      this.array = messages;
    }
  }

  public get count(): number {
    return this.array.length;
  }

  public addMessageToTop = (message: Message): void => {
    this.array.unshift(message);
  };

  public addMessageToBottom = (message: Message): void => {
    this.array.push(message);
  };

  public clear = (): void => {
    this.array = [];
  };
}
