import type { MouseEventHandler } from 'react';

import { observer } from 'mobx-react-lite';

import { cardTypeColors } from '@/routes/games/cryptoz/RoomPage/components/entites/Card/utils';
import { cn } from '@/lib/utils';

import type { TCardSimpleProps } from './components/CardSimple';
import type { TCardShirtProps } from './components/CardShirt';

import { CardSimple } from './components/CardSimple';
import { CardShirt } from './components/CardShirt';

type TProps = {
  className?: string;
  onClick?: MouseEventHandler;
  isDisabled?: boolean;
} & (TCardSimpleProps | TCardShirtProps);

export const Card = observer(function Card(params: TProps) {
  return (
    <div
      className={cn(
        'flex aspect-[2/3] h-[270px] select-none rounded-[6px] border-2',
        params.className,
        !params.isShowShirt && cardTypeColors[params.type],
        {
          'h-[60px] rounded-[2px] border-[1px]': params.variant === 'sm',
          'h-[370px]': params.variant === 'lg',
          'border-0': params.isShowShirt,
          'cursor-pointer': !params.isDisabled && params.onClick,
        },
      )}
      onClick={!params.isDisabled ? params.onClick : undefined}
      tabIndex={params.isDisabled && params.onClick ? -1 : 0}
    >
      {params.isShowShirt
        ? (<CardShirt {...params} />)
        : (<CardSimple {...params} />)}
    </div>
  );
});
