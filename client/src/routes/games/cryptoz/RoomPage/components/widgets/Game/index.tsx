import { observer } from 'mobx-react-lite';

import { roomStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { Typography } from '@/components/ui/Typography';

import { Market } from './components/Market';
import { Arena } from './components/Arena';

export const Game = observer(function Game() {
  const activePlayerNickname = roomStore.room.activePlayerNickname;
  const isMeActive = activePlayerNickname ? roomStore.isMe(activePlayerNickname) : false;

  return (
    <div className="flex flex-1 flex-col gap-2">
      {activePlayerNickname && (
        <div className="flex justify-center px-4 pt-4">
          <Typography className="text-center text-muted-foreground" variant="large">
            Сейчас ходит:
            {' '}
            <span className={`font-semibold ${isMeActive ? 'text-primary' : 'text-foreground'}`}>
              {activePlayerNickname}
            </span>
          </Typography>
        </div>
      )}
      <Market />
      <Arena />
    </div>
  );
});
