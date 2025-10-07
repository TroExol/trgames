import { observer } from 'mobx-react-lite';

import { cn } from '@/lib/utils';
import cardShirtImg from '@/assets/games/cryptoz/card-shirt.jpg';

interface TSizeProp {
  variant?: 'lg' | 'sm' | 'md';
}

export interface TCardShirtProps extends TSizeProp {
  isShowShirt: true;
}

export const CardShirt = observer(function CardShirt({
  variant,
}: TCardShirtProps) {
  return (
    <div
      className={cn('size-full rounded-[5px] bg-black/20 bg-cover bg-center bg-no-repeat bg-blend-darken', {
        'rounded-[1px]': variant === 'sm',
      })}
      style={{ backgroundImage: `url(${cardShirtImg})` }}
    />
  );
});
