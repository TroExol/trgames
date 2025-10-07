import type { CryptozShared } from '@trgames/shared';

import { observer } from 'mobx-react-lite';

import { Ability } from '@/routes/games/cryptoz/RoomPage/components/entites/Ability';

import type { TPlayAbilityProps } from './types';

import { roomStore } from '../../../../stores';

export const PlayAbility = observer(function PlayAbility({
  onSubmit,
}: TPlayAbilityProps) {
  const isDisabled = (ability: CryptozShared.TAbility) => {
    return !ability.canPlayHandler || ability.isPlayed || ability.isPlaying;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        {roomStore.me?.abilities.map(ability => (
          <div className="flex w-min flex-col items-center gap-1" key={ability.uuid}>
            <Ability
              {...ability}
              isDisabled={isDisabled(ability)}
              onClick={!isDisabled(ability) ? () => onSubmit(ability) : undefined}
              variant="lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
});
