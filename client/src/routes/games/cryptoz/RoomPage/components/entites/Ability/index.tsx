import type { MouseEventHandler } from 'react';

import { observer } from 'mobx-react-lite';

import type {
  TAbilitySimpleProps,
} from '@/routes/games/cryptoz/RoomPage/components/entites/Ability/components/AbilitySimple';
import type {
  TAbilityShirtProps,
} from '@/routes/games/cryptoz/RoomPage/components/entites/Ability/components/AbilityShirt';

import { AbilitySimple } from '@/routes/games/cryptoz/RoomPage/components/entites/Ability/components/AbilitySimple';
import { AbilityShirt } from '@/routes/games/cryptoz/RoomPage/components/entites/Ability/components/AbilityShirt';
import { cn } from '@/lib/utils';

type TProps = {
  className?: string;
  onClick?: MouseEventHandler;
  isDisabled?: boolean;
} & (TAbilityShirtProps | TAbilitySimpleProps);

export const Ability = observer(function Ability(params: TProps) {
  return (
    <div
      className={cn(
        'aspect-[2/1] w-[230px] select-none rounded-[6px] border-2',
        params.className,
        {
          'w-[50px] rounded-[2px] border-[1px]': params.variant === 'sm',
          'w-[300px]': params.variant === 'lg',
          'cursor-pointer': !params.isDisabled && params.onClick,
        },
      )}
      onClick={!params.isDisabled ? params.onClick : undefined}
      tabIndex={params.isDisabled && params.onClick ? -1 : 0}
    >
      {params.isShowShirt
        ? (<AbilityShirt {...params} />)
        : (<AbilitySimple {...params} />)}
    </div>
  );
});
