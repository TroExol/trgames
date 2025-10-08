import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { dialogStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { StoneShard } from '@/routes/games/cryptoz/RoomPage/components/entites/StoneShard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

import type { TStoneShardsProps } from './types';

export const StoneShards = observer(function StoneShards({
  stoneShards,
  countStoneShardsToSelect,
  variants,
  onSubmit,
}: TStoneShardsProps) {
  const [selectedStoneShards, setSelectedStoneShards] = useState<Set<string>>(new Set());
  const isReadOnly = dialogStore.isDialogActionsDisabled;

  // Если количество способностей <= countAbilitiesToSelect, выбираем все способности по умолчанию
  useEffect(() => {
    if (countStoneShardsToSelect && stoneShards.length <= countStoneShardsToSelect) {
      setSelectedStoneShards(new Set(stoneShards.map(stoneShard => stoneShard.uuid)));
    }
  }, [stoneShards, countStoneShardsToSelect]);

  const canSelect = countStoneShardsToSelect !== undefined ? stoneShards.length > countStoneShardsToSelect : false;

  const isAllStoneShardsSelected = countStoneShardsToSelect !== undefined
    ? selectedStoneShards.size === countStoneShardsToSelect
    : false;

  const handleStoneShardClick = (stoneShardUuid: string) => {
    if (!canSelect || isReadOnly) {
      return;
    }

    setSelectedStoneShards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stoneShardUuid)) {
        newSet.delete(stoneShardUuid);
      } else {
        // Проверяем лимит выбора
        if (!countStoneShardsToSelect || newSet.size < countStoneShardsToSelect) {
          newSet.add(stoneShardUuid);
        }
      }
      return newSet;
    });
  };

  const handleVariantClick = (variantId: string | number) => {
    if (!onSubmit || isReadOnly) return;

    const selectedStoneShardsArray = stoneShards.filter(stoneShard => selectedStoneShards.has(stoneShard.uuid));
    onSubmit(variantId, selectedStoneShardsArray);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        {stoneShards.map(stoneShard => (
          <div className="flex w-min flex-col items-center gap-1" key={stoneShard.uuid}>
            <StoneShard
              {...stoneShard}
              className={cn({
                'rounded-lg ring-4 ring-primary': selectedStoneShards.has(stoneShard.uuid),
              })}
              isShowPlaying={false}
              onClick={!isReadOnly && canSelect ? () => handleStoneShardClick(stoneShard.uuid) : undefined}
              variant="lg"
            />
          </div>
        ))}
      </div>

      {variants && variants.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-2">
          {variants.map(variant => (
            <Button
              className="whitespace-normal text-center"
              disabled={isReadOnly || !isAllStoneShardsSelected}
              key={variant.id}
              onClick={() => handleVariantClick(variant.id)}
              variant="outline"
            >
              {variant.value}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
});
