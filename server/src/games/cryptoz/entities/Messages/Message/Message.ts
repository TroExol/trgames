import type { CryptozShared } from '@trgames/shared';

import { v4 as uuidv4 } from 'uuid';

import type { Player } from '@/games/cryptoz/entities/Players/Player';
import type { TMessageConstructorParams } from '@/games/cryptoz/entities/Messages/Message/types';

export class Message {
  private readonly uuid = uuidv4();
  private readonly date = new Date().toISOString();
  private readonly message: string;
  private readonly sender: Player;

  constructor({ message, sender }: TMessageConstructorParams) {
    this.message = message;
    this.sender = sender;
  }

  format(): CryptozShared.TMessage {
    return {
      uuid: this.uuid,
      message: this.message,
      date: this.date,
      senderNickname: this.sender.nickname,
      senderParticipant: this.sender.participant,
    };
  }
}
