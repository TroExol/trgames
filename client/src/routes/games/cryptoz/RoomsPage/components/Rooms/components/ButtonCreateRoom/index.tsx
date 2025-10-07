import { useBoolean } from 'usehooks-ts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { socketService } from '@/routes/games/cryptoz/RoomsPage/services';
import { socketService as roomSocketService } from '@/routes/games/cryptoz/RoomPage/services';
import { useNickname } from '@/hooks/useNickname';
import { Slider } from '@/components/ui/Slider';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { DrawerDialog } from '@/components/ui/DrawerDialog';
import { Button } from '@/components/ui/Button';

export const ButtonCreateRoom = observer(function ButtonCreateRoom() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useNickname();
  const [roomName, setRoomName] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [maxMarket, setMaxMarket] = useState(5);
  const [roomPassword, setRoomPassword] = useState<string>();

  const { value: isOpen, setValue: setIsOpen } = useBoolean(false);

  const onOpenChange = (currentIsOpen: boolean) => {
    if (currentIsOpen) {
      return;
    }
    setRoomName('');
    setMaxPlayers(5);
    setMaxMarket(5);
    setRoomPassword(undefined);
  };

  const createRoom = () => {
    socketService.createRoom({
      name: roomName.trim(),
      maxMarket,
      maxPlayers,
      roomPassword,
    }).then(async uuid => {
      onOpenChange(false);
      setIsOpen(false);

      try {
        await roomSocketService.connect({
          roomUuid: uuid,
          nickname,
          participant: 'player',
          roomPassword,
        });
        navigate(`room/${uuid}`);
      } catch { /* empty */ }
    }).catch(error => {
      toast.error((error instanceof Error && error.message) || 'Неизвестная ошибка');
    });
  };

  return (
    <DrawerDialog
      content={(
        <div className="flex flex-col gap-4 overflow-y-auto p-4 sm:-m-px sm:p-1">
          <Input
            onChange={event => setRoomName(event.target.value)}
            placeholder="Название комнаты"
            required
            type="text"
            value={roomName}
          />
          <Input
            onChange={event => setNickname(event.target.value)}
            placeholder="Никнейм"
            required
            type="text"
            value={nickname}
          />
          <div>
            <Label className="mb-4 block" htmlFor="settingMaxPlayers">
              Максимальное количество участников:
              {' '}
              {maxPlayers}
            </Label>
            <Slider
              id="settingMaxPlayers"
              max={8}
              min={2}
              onValueChange={([value]) => setMaxPlayers(value)}
              step={1}
              value={[maxPlayers]}
            />
          </div>
          <div>
            <Label className="mb-4 block" htmlFor="settingMaxMarket">
              Максимальное количество карт на рынке:
              {' '}
              {maxMarket}
            </Label>
            <Slider
              id="settingMaxMarket"
              max={6}
              min={3}
              onValueChange={([value]) => setMaxMarket(value)}
              step={1}
              value={[maxMarket]}
            />
          </div>
          <Input
            autoComplete="off"
            onChange={event => setRoomPassword(event.target.value.trim())}
            placeholder="Пароль комнаты (необязательно)"
            type="password"
            value={roomPassword}
          />
          <Button
            className="mt-4"
            disabled={!roomName.trim() || !nickname || maxPlayers < 2 || maxMarket < 3}
            onClick={createRoom}
            variant="secondary"
          >
            Создать
          </Button>
        </div>
      )}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      setIsOpen={setIsOpen}
      title={(<span className="inline-block w-full text-center">Создание комнаты</span>)}
    >
      <Button className="m-2 sm:m-4" variant="secondary">
        Создать комнату
      </Button>
    </DrawerDialog>
  );
});
