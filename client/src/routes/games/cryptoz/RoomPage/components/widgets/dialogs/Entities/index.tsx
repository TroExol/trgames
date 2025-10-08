import { observer } from 'mobx-react-lite';

import { Typography } from '@/components/ui/Typography';

import type { TEntitiesProps } from './types';

import { StoneShards } from '../StoneShards';
import { Cards } from '../Cards';
import { Abilities } from '../Abilities';

export const Entities = observer(function Entities({
  cards,
  cardsSubtitle,
  abilities,
  stoneShards,
}: TEntitiesProps) {
  const hasCards = Boolean(cards?.length);
  const hasAbilities = Boolean(abilities?.length);
  const hasStoneShards = Boolean(stoneShards?.length);

  if (!hasCards && !hasAbilities && !hasStoneShards) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {hasCards && cards && (
        <div className="flex flex-col gap-2">
          <Typography className="text-center" variant="h3">
            Карты
          </Typography>
          <Cards cards={cards} cardsSubtitle={cardsSubtitle} countCardsToSelect={0} />
        </div>
      )}

      {hasAbilities && abilities && (
        <div className="flex flex-col gap-2">
          <Typography className="text-center" variant="h3">
            Способности
          </Typography>
          <Abilities abilities={abilities} />
        </div>
      )}

      {hasStoneShards && stoneShards && (
        <div className="flex flex-col gap-2">
          <Typography className="text-center" variant="h3">
            Осколки философского камня
          </Typography>
          <StoneShards stoneShards={stoneShards} />
        </div>
      )}
    </div>
  );
});
