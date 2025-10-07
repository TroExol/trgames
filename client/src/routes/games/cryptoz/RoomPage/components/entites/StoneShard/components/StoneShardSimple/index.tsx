import type { CryptozShared } from '@trgames/shared';

import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { cn } from '@/lib/utils';
import { useAutoFontSize } from '@/hooks/useAutoFontSize';

interface TSizeProp {
  variant?: 'lg' | 'sm' | 'md';
}

export interface TStoneShardSimpleProps extends CryptozShared.TStoneShard, TSizeProp {
  isDisabled?: boolean;
  isShowShirt?: false;
  isShowPlaying?: boolean;
}

export const StoneShardSimple = observer(function StoneShardSimple({
  description,
  isDisabled,
  variant = 'md',
}: TStoneShardSimpleProps) {
  // Настройки автоматического масштабирования в зависимости от варианта
  const fontSizeOptions = useMemo(() => ({
    sm: { minSize: 2, maxSize: 4, step: 0.2 },
    md: { minSize: 6, maxSize: 14, step: 0.3 },
    lg: { minSize: 8, maxSize: 18, step: 0.5 },
  }), []);

  const { containerRef } = useAutoFontSize(fontSizeOptions[variant]);

  return (
    <div
      className={cn('flex size-full flex-col rounded-lg p-1', {
        'p-[2px]': variant === 'sm',
        'brightness-[60%]': isDisabled,
      })}
    >
      <div
        className={cn('flex size-full items-center justify-center rounded-lg border-2 bg-card p-2 text-center text-[10px] leading-none', {
          'rounded-[1px] text-[3px] border-[1px] p-[1px]': variant === 'sm',
          'text-md leading-tight': variant === 'lg',
        })}
        ref={containerRef}
      >
        {description}
      </div>
    </div>
  );
});
