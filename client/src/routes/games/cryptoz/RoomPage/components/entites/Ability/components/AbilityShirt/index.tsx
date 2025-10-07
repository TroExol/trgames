import { observer } from 'mobx-react-lite';

import { cn } from '@/lib/utils';
import abilityShirtImg from '@/assets/games/cryptoz/ability-shirt.jpg';

interface TSizeProp {
  variant?: 'lg' | 'sm' | 'md';
}

export interface TAbilityShirtProps extends TSizeProp {
  isShowShirt: true;
}

export const AbilityShirt = observer(function AbilityShirt({
  variant,
}: TAbilityShirtProps) {
  return (
    <div
      className={cn('size-full rounded-[6px] bg-black/20 bg-cover bg-center bg-no-repeat bg-blend-darken', {
        'rounded-[2px]': variant === 'sm',
      })}
      style={{ backgroundImage: `url(${abilityShirtImg})` }}
    />
  );
});
