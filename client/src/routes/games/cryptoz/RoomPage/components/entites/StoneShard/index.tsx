import type { MouseEventHandler } from 'react';

import { observer } from 'mobx-react-lite';

import { cn } from '@/lib/utils';

import type { TStoneShardSimpleProps } from './components/StoneShardSimple';
import type { TStoneShardShirtProps } from './components/StoneShardShirt';

import { StoneShardSimple } from './components/StoneShardSimple';
import { StoneShardShirt } from './components/StoneShardShirt';

type TProps = {
  className?: string;
  onClick?: MouseEventHandler;
  isDisabled?: boolean;
} & (TStoneShardShirtProps | TStoneShardSimpleProps);

export const StoneShard = observer(function StoneShard(params: TProps) {
  return (
    <div
      className={cn(
        'aspect-square w-[140px] select-none rounded-lg border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/80 to-blue-900/80 shadow-lg',
        {
          'w-[35px] border-[1px] rounded-md': params.variant === 'sm',
          'w-[220px] rounded-xl': params.variant === 'lg',
          'cursor-pointer': !params.isDisabled && params.onClick,
          'opacity-50': params.isDisabled,
        },
      )}
      onClick={!params.isDisabled ? params.onClick : undefined}
      tabIndex={params.isDisabled && params.onClick ? -1 : 0}
    >
      {params.isShowShirt
        ? (<StoneShardShirt {...params} />)
        : (<StoneShardSimple {...params} />)}
    </div>
  );
});
