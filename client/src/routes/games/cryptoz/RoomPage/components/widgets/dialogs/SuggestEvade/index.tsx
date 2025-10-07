import type { CryptozShared } from '@trgames/shared';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { cn } from '@/lib/utils';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

import type { TSuggestEvadeProps } from './types';

import { Card } from '../../../entites/Card';

export const SuggestEvade = observer(({
  cards,
  cardsToShow,
  cardAttack,
  variants,
  onSubmit,
}: TSuggestEvadeProps) => {
  const [selectedCard, setSelectedCard] = useState<CryptozShared.TCard>();

  const handleSubmit = (id: number) => {
    if (selectedCard) {
      onSubmit(id, selectedCard);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!!cardsToShow?.length && (
        <div className="flex flex-wrap justify-center gap-3">
          {cardsToShow.map(card => (
            <div className="flex w-min flex-col items-center gap-1" key={card.uuid}>
              <Card
                {...card}
                isShowPlaying={false}
                variant="lg"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Typography className="w-full text-center" variant="h3">Карта атаки</Typography>
        <div className="flex w-min flex-col items-center gap-1">
          <Card
            {...cardAttack}
            isShowPlaying={false}
            variant="lg"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Typography className="w-full text-center" variant="h3">Ты можешь выбрать карту для укрытия</Typography>
        <div className="flex flex-wrap justify-center gap-3">
          {cards.map(card => (
            <div className="flex w-min flex-col items-center gap-1" key={card.uuid}>
              <Card
                {...card}
                className={cn({
                  'ring-4 ring-primary': selectedCard?.uuid === card.uuid,
                })}
                isShowPlaying={false}
                onClick={() => setSelectedCard(card)}
                variant="lg"
              />
            </div>
          ))}
        </div>
      </div>

      {variants && variants.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-2">
          {variants.map(variant => (
            <Button
              className="whitespace-normal text-center"
              disabled={!selectedCard}
              key={variant.id}
              onClick={() => handleSubmit(variant.id)}
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
