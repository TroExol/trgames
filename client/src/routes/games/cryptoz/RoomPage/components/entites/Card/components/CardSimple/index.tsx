import { observer } from 'mobx-react-lite';
import { Gem, LoaderCircle } from 'lucide-react';
import { CryptozShared } from '@trgames/shared';

import { cn } from '@/lib/utils';
import { useAutoFontSize } from '@/hooks/useAutoFontSize';
import { Typography } from '@/components/ui/Typography';
import { getAssetUrl } from '@/assets/utils';

interface TSizeProp {
  variant?: 'lg' | 'sm' | 'md';
}

export interface TCardSimpleProps extends CryptozShared.TCard, TSizeProp {
  isDisabled?: boolean;
  isShowSimpleDescription?: boolean;
  isShowShirt?: false;
  isShowPlaying?: boolean;
}

export const CardSimple = observer(function CardSimple({
  name,
  description,
  simpleDescription,
  price,
  basePrice,
  gloryShards,
  baseGloryShards,
  id,
  type,
  isPlayingEvade,
  isPlayingGeneral,
  isPlayingSeal,
  isPlayingStrike,
  isPlayingTotalStrike,
  isDisabled,
  isShowSimpleDescription = true,
  variant = 'md',
  isShowPlaying = true,
}: TCardSimpleProps) {
  const descriptionToShow = isShowSimpleDescription
    ? simpleDescription
    : description;

  // Настройки автоматического масштабирования в зависимости от варианта
  const fontSizeOptions = {
    sm: { minSize: 2, maxSize: 4, step: 0.2 },
    md: { minSize: 4, maxSize: 12, step: 0.3 },
    lg: { minSize: 8, maxSize: 15, step: 0.5 },
  };

  const { containerRef } = useAutoFontSize(fontSizeOptions[variant]);

  const isPlaying = isShowPlaying && (isPlayingEvade
  || isPlayingGeneral
  || isPlayingSeal
  || isPlayingStrike
  || isPlayingTotalStrike);

  const imageUrl = type === CryptozShared.ECardType.CHAOS
    ? getAssetUrl(`games/cryptoz/cards/chaos.webp`)
    : getAssetUrl(`games/cryptoz/cards/${id}.webp`);

  return (
    <div
      className={cn('relative flex size-full flex-col rounded-[4px] text-left leading-snug', {
        'rounded-[1px]': variant === 'sm',
        'brightness-[60%]': isDisabled || isPlaying,
      })}
    >
      <LoaderCircle className={cn('absolute top-[calc(50%-12px)] z-10 hidden animate-spin content-center self-center', {
        block: isPlaying,
      })}
      />

      <Typography
        className={cn('w-full break-words px-1 text-[10px] shadow-stroke', {
          'text-[2px] p-[1px] shadow-stroke-none': variant === 'sm',
          'text-lg leading-tight': variant === 'lg',
        })}
        variant="p"
      >
        {name}
      </Typography>
      <div
        className={cn('relative flex w-full flex-1 items-end rounded-t-[6px] bg-black/15 bg-cover bg-top bg-no-repeat bg-blend-darken', {
          'rounded-t-[2px]': variant === 'sm',
        })}
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        {![
          CryptozShared.ECardType.CHAOS,
          CryptozShared.ECardType.CURSED_SEAL,
          CryptozShared.ECardType.DARKNESS_MADNESS,
        ].includes(type) && (
          <Typography
            className={cn('absolute top-0 ml-2 break-words rounded-b-[10px] bg-black p-1 px-2 text-[10px] leading-none', {
              'text-[2px] p-[1px] rounded-b-[2px] py-0 ml-[2px]': variant === 'sm',
              'text-md rounded-b-[14px] leading-none': variant === 'lg',
            })}
            variant="p"
          >
            {type}
          </Typography>
        )}
      </div>

      <div className={cn('flex max-h-[80%] min-h-[40%] w-full flex-col', {
        'leading-tight flex-1': variant === 'sm',
        'text-md leading-tight': variant === 'lg',
      })}
      >
        <div
          className={cn('flex flex-1 flex-col gap-1 overflow-hidden bg-card p-1', {
            'p-[1px] gap-0': variant === 'sm',
          })}
          ref={containerRef}
        >
          {descriptionToShow.general}
          {descriptionToShow.strike && (
            <span>
              <span className="text-blue-400">
                Мракобой:
              </span>
              {' '}
              {descriptionToShow.strike}
            </span>
          )}
          {descriptionToShow.seal && (
            <span>
              <span className="text-blue-400">
                Печать:
              </span>
              {' '}
              {descriptionToShow.seal}
            </span>
          )}
          {descriptionToShow.evade && (
            <span>
              <span className="text-blue-400">
                Укрытие:
              </span>
              {' '}
              {descriptionToShow.evade}
            </span>
          )}
          {descriptionToShow.totalStrike && (
            <span>
              <span className="text-blue-400">
                Тотальный мракобой:
              </span>
              {' '}
              {descriptionToShow.totalStrike}
            </span>
          )}
          {descriptionToShow.other}
        </div>

        <div
          className={cn('flex items-center justify-between rounded-b-[3px] px-1 py-[2px] text-[10px] shadow-stroke', {
            'text-[3px] py-[1px] px-[2px] leading-none rounded-b-[0.8px] shadow-stroke-none': variant === 'sm',
            'text-lg leading-tight rounded-b-[3px]': variant === 'lg',
          })}
        >
          <span className="relative">
            <Gem
              className={cn('inline-block size-[15px] text-amber-500', {
                'size-[3px]': variant === 'sm',
                'size-[23px]': variant === 'lg',
              })}
            />
            <span className={cn('absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2', {
              'text-green-500': gloryShards && (gloryShards > baseGloryShards),
              'text-red-600': gloryShards && (gloryShards < baseGloryShards),
            })}
            >
              {gloryShards ?? baseGloryShards}
            </span>
          </span>
          <span className={cn('', {
            'text-green-500': price < basePrice,
            'text-red-600': price > basePrice,
          })}
          >
            {price}
          </span>
        </div>
      </div>
    </div>
  );
});
