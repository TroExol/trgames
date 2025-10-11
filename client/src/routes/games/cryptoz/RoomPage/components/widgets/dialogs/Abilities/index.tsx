import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { Ability } from '@/routes/games/cryptoz/RoomPage/components/entites/Ability';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

import type { TAbilitiesProps } from './types';

export const Abilities = observer(function Abilities({
  abilities,
  countAbilitiesToSelect,
  variants,
  onSubmit,
}: TAbilitiesProps) {
  const [selectedAbilities, setSelectedAbilities] = useState<Set<string>>(new Set());

  const normalizedCountAbilitiesToSelect = typeof countAbilitiesToSelect === 'number'
    ? Number(countAbilitiesToSelect)
    : countAbilitiesToSelect;

  const hasValidCountAbilitiesToSelect = typeof normalizedCountAbilitiesToSelect === 'number'
    && !Number.isNaN(normalizedCountAbilitiesToSelect);

  const hasPositiveCountAbilitiesToSelect = hasValidCountAbilitiesToSelect
    && normalizedCountAbilitiesToSelect > 0;

  const positiveCountAbilitiesToSelect = hasPositiveCountAbilitiesToSelect
    ? normalizedCountAbilitiesToSelect
    : undefined;

  // Если количество способностей <= лимита, выбираем все способности по умолчанию.
  useEffect(() => {
    if (positiveCountAbilitiesToSelect === undefined) {
      setSelectedAbilities(new Set());
      return;
    }

    setSelectedAbilities(prev => {
      const normalizedSelection = new Set(
        Array.from(prev).filter(uuid => abilities.some(ability => ability.uuid === uuid)),
      );

      if (abilities.length <= positiveCountAbilitiesToSelect) {
        return new Set(abilities.map(ability => ability.uuid));
      }

      return normalizedSelection;
    });
  }, [abilities, positiveCountAbilitiesToSelect]);

  const canSelect = positiveCountAbilitiesToSelect !== undefined
    ? abilities.length > positiveCountAbilitiesToSelect
    : false;

  const isAllAbilitiesSelected = hasValidCountAbilitiesToSelect
    ? selectedAbilities.size === normalizedCountAbilitiesToSelect
    : false;

  const handleAbilityClick = (abilityUuid: string) => {
    if (!canSelect) {
      return;
    }

    setSelectedAbilities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(abilityUuid)) {
        newSet.delete(abilityUuid);
      } else {
        // Проверяем лимит выбора
        if (
          positiveCountAbilitiesToSelect !== undefined
          && newSet.size < positiveCountAbilitiesToSelect
        ) {
          newSet.add(abilityUuid);
        }
      }
      return newSet;
    });
  };

  const handleVariantClick = (variantId: string | number) => {
    if (!onSubmit) return;

    const selectedAbilitiesArray = abilities.filter(ability => selectedAbilities.has(ability.uuid));
    onSubmit(variantId, selectedAbilitiesArray);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        {abilities.map(ability => (
          <div className="flex w-min flex-col items-center gap-1" key={ability.uuid}>
            <Ability
              {...ability}
              className={cn({
                'rounded-lg ring-4 ring-primary': selectedAbilities.has(ability.uuid),
              })}
              isShowPlaying={false}
              onClick={canSelect ? () => handleAbilityClick(ability.uuid) : undefined}
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
              disabled={!isAllAbilitiesSelected}
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
