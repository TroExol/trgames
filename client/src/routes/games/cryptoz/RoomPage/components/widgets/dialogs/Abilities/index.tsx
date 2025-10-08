import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { dialogStore } from '@/routes/games/cryptoz/RoomPage/stores';
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
  const isReadOnly = dialogStore.isDialogActionsDisabled;

  // Если количество способностей <= countAbilitiesToSelect, выбираем все способности по умолчанию
  useEffect(() => {
    if (countAbilitiesToSelect && abilities.length <= countAbilitiesToSelect) {
      setSelectedAbilities(new Set(abilities.map(ability => ability.uuid)));
    }
  }, [abilities, countAbilitiesToSelect]);

  const canSelect = countAbilitiesToSelect !== undefined ? abilities.length > countAbilitiesToSelect : false;

  const isAllAbilitiesSelected = countAbilitiesToSelect !== undefined
    ? selectedAbilities.size === countAbilitiesToSelect
    : false;

  const handleAbilityClick = (abilityUuid: string) => {
    if (!canSelect || isReadOnly) {
      return;
    }

    setSelectedAbilities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(abilityUuid)) {
        newSet.delete(abilityUuid);
      } else {
        // Проверяем лимит выбора
        if (!countAbilitiesToSelect || newSet.size < countAbilitiesToSelect) {
          newSet.add(abilityUuid);
        }
      }
      return newSet;
    });
  };

  const handleVariantClick = (variantId: string | number) => {
    if (!onSubmit || isReadOnly) return;

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
              onClick={!isReadOnly && canSelect ? () => handleAbilityClick(ability.uuid) : undefined}
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
              disabled={isReadOnly || !isAllAbilitiesSelected}
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
