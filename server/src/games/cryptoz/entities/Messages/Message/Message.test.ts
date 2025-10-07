import {
  describe,
  expect,
  it,
} from 'vitest';
import _ from 'lodash';

import { MOCKED_CURRENT_DATE } from '@/vitest/constants';
import { createMockRoomWithPlayers } from '@/games/cryptoz/vitest/utils';

import { Message } from './index';

describe('Message', () => {
  it('format возвращает корректные значения', () => {
    const { activePlayer } = createMockRoomWithPlayers();
    const message = new Message({ message: 'message', sender: activePlayer });

    expect(_.omit(message.format(), 'uuid')).toEqual({
      message: 'message',
      date: MOCKED_CURRENT_DATE.toISOString(),
      senderNickname: activePlayer.nickname,
      senderParticipant: activePlayer.participant,
    });
  });
});
