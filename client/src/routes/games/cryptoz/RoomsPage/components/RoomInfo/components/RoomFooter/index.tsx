import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { CryptozShared, EGame } from '@trgames/shared';

import { analyticsService } from '@/services';
import { roomsStore } from '@/routes/games/cryptoz/RoomsPage/stores';
import { socketService as roomSocketService } from '@/routes/games/cryptoz/RoomPage/services';
import { useNickname } from '@/hooks/useNickname';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const RoomFooter = observer(function RoomFooter() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useNickname();
  const [roomPassword, setRoomPassword] = useState<string>();

  const joinRoom = (participant: 'player' | 'viewer') => {
    if (!roomsStore.currentRoom) {
      return;
    }
    const roomUuid = roomsStore.currentRoom.uuid;
    roomSocketService.connect({
      roomUuid,
      nickname,
      participant,
      roomPassword: roomPassword,
    }).then(() => {
      analyticsService.identify({ nickname });
      analyticsService.track(CryptozShared.EAnalyticsEvent.ROOM_JOINED, {
        game: EGame.CRYPTOZ,
        isViewer: participant === 'viewer',
        roomId: roomUuid,
      });
      navigate(`room/${roomUuid}`);
    }).catch(() => {});
  };

  return roomsStore.currentRoom && !roomsStore.currentRoom.isGameEnded && (
    <>
      <div className="contents lg:flex lg:gap-4">
        <Input
          className="lg:w-[250px]"
          onChange={event => setNickname(event.target.value)}
          placeholder="Никнейм"
          required
          type="text"
          value={nickname}
        />
        {roomsStore.currentRoom.isWithPassword && (
          <Input
            autoComplete="off"
            className="lg:w-[250px]"
            onChange={event => setRoomPassword(event.target.value.trim())}
            placeholder="Пароль комнаты"
            required
            type="password"
            value={roomPassword}
          />
        )}
      </div>
      <div className="contents lg:flex lg:gap-4">
        <Tooltip key={roomsStore.currentRoom.uuid}>
          <TooltipTrigger asChild>
            <div>
              <Button
                className="w-full"
                disabled={(roomsStore.currentRoom.isWithPassword && !roomPassword)
                    || (roomsStore.currentRoom.isGameStarted
                      && roomsStore.currentRoom.countOnlinePlayers >= roomsStore.currentRoom.playerNicknames.length)}
                onClick={() => joinRoom('player')}
                variant="secondary"
              >
                Подключиться участником
              </Button>
            </div>
          </TooltipTrigger>
          {roomsStore.currentRoom.isGameStarted && (
            <TooltipContent>
              Игра уже началась
            </TooltipContent>
          )}
        </Tooltip>
        <Button
          disabled={roomsStore.currentRoom.isWithPassword && !roomPassword}
          onClick={() => joinRoom('viewer')}
        >
          Подключиться зрителем
        </Button>
      </div>
    </>
  );
});
