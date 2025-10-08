import { observer } from 'mobx-react-lite';

import { dialogStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { Button } from '@/components/ui/Button';

import type { TSelectVariantProps } from './types';

export const SelectVariant = observer(({
  variants,
  onSubmit,
}: TSelectVariantProps) => {
  const isReadOnly = dialogStore.isDialogActionsDisabled;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {variants.map(variant => (
        <Button
          className="whitespace-normal text-center"
          disabled={isReadOnly}
          key={variant.id}
          onClick={() => {
            if (isReadOnly) {
              return;
            }
            onSubmit(variant.id);
          }}
          variant="outline"
        >
          {variant.value}
        </Button>
      ))}
    </div>
  );
});
