import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';

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

  const normalizedCountStoneShardsToSelect = typeof countStoneShardsToSelect === 'number'
    ? Number(countStoneShardsToSelect)
    : countStoneShardsToSelect;

  const hasValidCountStoneShardsToSelect = typeof normalizedCountStoneShardsToSelect === 'number'
    && !Number.isNaN(normalizedCountStoneShardsToSelect);

  const hasPositiveCountStoneShardsToSelect = hasValidCountStoneShardsToSelect
    && normalizedCountStoneShardsToSelect > 0;

  const positiveCountStoneShardsToSelect = hasPositiveCountStoneShardsToSelect
    ? normalizedCountStoneShardsToSelect
    : undefined;

  // Если количество осколков <= лимита, выбираем все осколки по умолчанию.
  useEffect(() => {
    if (positiveCountStoneShardsToSelect === undefined) {
      setSelectedStoneShards(new Set());
      return;
    }

    setSelectedStoneShards(prev => {
      const normalizedSelection = new Set(
        Array.from(prev).filter(uuid => stoneShards.some(stoneShard => stoneShard.uuid === uuid)),
      );

      if (stoneShards.length <= positiveCountStoneShardsToSelect) {
        return new Set(stoneShards.map(stoneShard => stoneShard.uuid));
      }

      return normalizedSelection;
    });
  }, [stoneShards, positiveCountStoneShardsToSelect]);

  const canSelect = positiveCountStoneShardsToSelect !== undefined
    ? stoneShards.length > positiveCountStoneShardsToSelect
    : false;

  const isAllStoneShardsSelected = hasValidCountStoneShardsToSelect
    ? selectedStoneShards.size === normalizedCountStoneShardsToSelect
    : false;

  const handleStoneShardClick = (stoneShardUuid: string) => {
    if (!canSelect) {
      return;
    }

    setSelectedStoneShards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stoneShardUuid)) {
        newSet.delete(stoneShardUuid);
      } else {
        // Проверяем лимит выбора
        if (
          positiveCountStoneShardsToSelect !== undefined
          && newSet.size < positiveCountStoneShardsToSelect
        ) {
          newSet.add(stoneShardUuid);
        }
      }
      return newSet;
    });
  };

  const handleVariantClick = (variantId: string | number) => {
    if (!onSubmit) return;

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
              onClick={canSelect ? () => handleStoneShardClick(stoneShard.uuid) : undefined}
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
              disabled={!isAllStoneShardsSelected}
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
