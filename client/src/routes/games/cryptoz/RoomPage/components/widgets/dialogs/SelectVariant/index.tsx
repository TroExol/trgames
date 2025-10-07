import { observer } from 'mobx-react-lite';

import { Button } from '@/components/ui/Button';

import type { TSelectVariantProps } from './types';

export const SelectVariant = observer(({
  variants,
  onSubmit,
}: TSelectVariantProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {variants.map(variant => (
        <Button
          className="whitespace-normal text-center"
          key={variant.id}
          onClick={() => onSubmit(variant.id)}
          variant="outline"
        >
          {variant.value}
        </Button>
      ))}
    </div>
  );
});
