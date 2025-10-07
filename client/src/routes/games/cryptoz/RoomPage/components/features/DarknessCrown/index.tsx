import { observer } from 'mobx-react-lite';
import { Crown } from 'lucide-react';

import { roomStore } from '@/routes/games/cryptoz/RoomPage/stores';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

export const DarknessCrown = observer(function DarknessCrown() {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-default">
        <Crown />
      </TooltipTrigger>
      <TooltipContent className="w-[150px]">
        {roomStore.room.darknessCrown.description}
      </TooltipContent>
    </Tooltip>
  );
});
