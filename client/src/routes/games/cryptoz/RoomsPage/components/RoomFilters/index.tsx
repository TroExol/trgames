import type React from 'react';

import { observer } from 'mobx-react-lite';
import { Funnel } from 'lucide-react';

import { roomsStore } from '@/routes/games/cryptoz/RoomsPage/stores';
import { Input } from '@/components/ui/Input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Button } from '@/components/ui/Button';

export const RoomFilters = observer(function RoomFilters() {
  const onClickIsWithoutPassword = (event: React.MouseEvent) => {
    event.preventDefault();
    roomsStore.toggleIsWithoutPassword();
  };

  const onClickIsNotStarted = (event: React.MouseEvent) => {
    event.preventDefault();
    roomsStore.toggleIsGameNotStarted();
  };

  const onNameChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    roomsStore.setNameFilter(event.target.value);
  };

  return (
    <div className="rounded-md border border-border p-2 shadow-md shadow-accent sm:p-4">
      <div className="mb-2">
        Комнаты:
        {' '}
        {roomsStore.filteredRooms.length}
      </div>
      <div className="flex justify-between">
        <Input className="mr-4" onChange={onNameChanged} placeholder="Название комнаты" type="text" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="Фильтры поиска комнат" variant="ghost">
              <Funnel />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              aria-label="Без пароля"
              checked={roomsStore.filters.isWithoutPassword}
              onClick={onClickIsWithoutPassword}
            >
              Без пароля
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              aria-label="Игра не началась"
              checked={roomsStore.filters.isGameNotStarted}
              onClick={onClickIsNotStarted}
            >
              Игра не началась
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
