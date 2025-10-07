import type { CryptozShared } from '@trgames/shared';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { Card } from '@/routes/games/cryptoz/RoomPage/components/entites/Card';
import { Ability } from '@/routes/games/cryptoz/RoomPage/components/entites/Ability';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

import type { TSelectStartCardsProps } from './types';

export const SelectStartCards = observer(function SelectStartCards({
  abilities,
  companions,
  onSubmit,
}: TSelectStartCardsProps) {
  const [selectedCompanion, setSelectedCompanion] = useState<CryptozShared.TCard | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<CryptozShared.TAbility | null>(null);

  const handleSubmit = () => {
    if (selectedCompanion && selectedAbility) {
      onSubmit(selectedCompanion, selectedAbility);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        {abilities.map(ability => (
          <Ability
            key={ability.uuid}
            {...ability}
            className={cn({
              'rounded-lg ring-4 ring-primary': selectedAbility === ability,
            })}
            onClick={() => setSelectedAbility(ability)}
            variant="lg"
          />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {companions.map(companion => (
          <Card
            key={companion.uuid}
            {...companion}
            className={cn({
              'rounded-lg ring-4 ring-primary': selectedCompanion === companion,
            })}
            onClick={() => setSelectedCompanion(companion)}
            variant="lg"
          />
        ))}
      </div>
      <Button
        disabled={!selectedCompanion || !selectedAbility}
        onClick={handleSubmit}
      >
        Выбрать
      </Button>
    </div>
  );
});
