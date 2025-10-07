import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';

import { MessageGroup } from './MessageGroup';
import { Message } from '../Message';

describe('MessageGroup', () => {
  let messageGroup: MessageGroup;
  const { activePlayer } = createMockRoomWithPlayers();

  beforeEach(() => {
    messageGroup = new MessageGroup();
  });

  it('Инстанс создается', () => {
    expect(messageGroup).toBeInstanceOf(MessageGroup);
  });

  it('Добавляет сообщения', () => {
    const message1 = new Message({ message: 'message', sender: activePlayer });
    const message2 = new Message({ message: 'message', sender: activePlayer });
    const message3 = new Message({ message: 'message', sender: activePlayer });

    messageGroup.addMessageToTop(message1);
    expect(messageGroup.count).toBe(1);
    messageGroup.addMessageToBottom(message2);
    expect(messageGroup.count).toBe(2);
    messageGroup.addMessageToTop(message3);
    expect(messageGroup.count).toBe(3);
  });

  it('Очищается', () => {
    const message1 = new Message({ message: 'message', sender: activePlayer });
    const message2 = new Message({ message: 'message', sender: activePlayer });
    const message3 = new Message({ message: 'message', sender: activePlayer });

    messageGroup.addMessageToBottom(message1);
    messageGroup.addMessageToBottom(message2);
    messageGroup.addMessageToBottom(message3);

    messageGroup.clear();

    expect(messageGroup.count).toBe(0);
  });
});
