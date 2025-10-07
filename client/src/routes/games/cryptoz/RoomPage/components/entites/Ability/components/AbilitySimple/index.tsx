import type { MouseEventHandler } from 'react';
import type { CryptozShared } from '@trgames/shared';

import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAutoFontSize } from '@/hooks/useAutoFontSize';

interface TSizeProp {
  variant?: 'lg' | 'sm' | 'md';
}

export interface TAbilitySimpleProps extends CryptozShared.TAbility, TSizeProp {
  onClick?: MouseEventHandler;
  isDisabled?: boolean;
  isShowShirt?: false;
  isShowPlaying?: boolean;
}

export const AbilitySimple = observer(function AbilitySimple({
  description,
  isPlaying,
  isDisabled,
  variant = 'md',
  isShowPlaying = true,
}: TAbilitySimpleProps) {
  // Настройки автоматического масштабирования в зависимости от варианта
  const fontSizeOptions = useMemo(() => ({
    sm: { minSize: 2, maxSize: 4, step: 0.2 },
    md: { minSize: 6, maxSize: 14, step: 0.3 },
    lg: { minSize: 8, maxSize: 18, step: 0.5 },
  }), []);

  const isPlayingAbility = isShowPlaying && isPlaying;

  const { containerRef } = useAutoFontSize(fontSizeOptions[variant]);

  return (
    <div
      className={cn(
        'relative flex size-full flex-col overflow-hidden rounded-lg bg-gradient-to-br from-purple-900/20 to-indigo-900/20 p-1.5 text-left',
        {
          'rounded-sm p-0.5': variant === 'sm',
          'brightness-50 grayscale': isDisabled || isPlayingAbility,
        },
      )}
    >
      {/* Лоадер */}
      <LoaderCircle
        className={cn(
          'absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 animate-spin text-purple-400',
          {
            block: isPlayingAbility,
            hidden: !isPlayingAbility,
          },
        )}
        size={variant === 'sm' ? 12 : variant === 'lg' ? 24 : 16}
      />

      {/* Основной контент */}
      <div
        className={cn(
          'relative flex size-full items-center justify-center rounded-md border border-purple-400/30 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 p-3 text-center shadow-lg backdrop-blur-sm',
          {
            'rounded-sm border-purple-300/20 p-1': variant === 'sm',
            'border-purple-500/40 p-4 shadow-xl': variant === 'lg',
          },
        )}
      >
        {/* Текст */}
        <div
          className="relative z-10 font-medium leading-tight text-slate-100 drop-shadow-sm"
          ref={containerRef}
        >
          {description}
        </div>
      </div>
    </div>
  );
});
