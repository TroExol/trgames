import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { dialogStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { Card } from '@/routes/games/cryptoz/RoomPage/components/entites/Card';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

import type { TCardsProps } from './types';

export const Cards = observer(function Cards({
  cards,
  cardsSubtitle,
  countCardsToSelect,
  variants,
  onSubmit,
}: TCardsProps) {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const isReadOnly = dialogStore.isDialogActionsDisabled;

  const normalizedCountCardsToSelect = countCardsToSelect == null
    ? countCardsToSelect
    : Number(countCardsToSelect);

  const hasValidCountCardsToSelect = typeof normalizedCountCardsToSelect === 'number'
    && !Number.isNaN(normalizedCountCardsToSelect);

  const hasPositiveCountCardsToSelect = hasValidCountCardsToSelect
    && normalizedCountCardsToSelect > 0;

  // Если количество карт <= countCardsToSelect, выбираем все карты по умолчанию
  useEffect(() => {
    if (
      hasPositiveCountCardsToSelect
      && cards.length <= normalizedCountCardsToSelect
    ) {
      setSelectedCards(new Set(cards.map(card => card.uuid)));
    }
  }, [cards, hasPositiveCountCardsToSelect, normalizedCountCardsToSelect]);

  const canSelect = normalizedCountCardsToSelect === null
    || !hasValidCountCardsToSelect
    || (hasPositiveCountCardsToSelect ? cards.length > normalizedCountCardsToSelect : false);

  const isAllCardsSelected = normalizedCountCardsToSelect === null
    || !hasValidCountCardsToSelect
    || selectedCards.size === normalizedCountCardsToSelect;

  const handleCardClick = (cardUuid: string) => {
    if (!canSelect || isReadOnly) return;

    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardUuid)) {
        newSet.delete(cardUuid);
      } else {
        // Проверяем лимит выбора
        if (
          !hasValidCountCardsToSelect
          || normalizedCountCardsToSelect === null
          || newSet.size < normalizedCountCardsToSelect
        ) {
          newSet.add(cardUuid);
        }
      }
      return newSet;
    });
  };

  const handleVariantClick = (variantId: string | number) => {
    if (!onSubmit || isReadOnly) return;

    const selectedCardsArray = cards.filter(card => selectedCards.has(card.uuid));
    onSubmit(variantId, selectedCardsArray);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        {cards.map(card => (
          <div className="flex w-min flex-col items-center gap-1" key={card.uuid}>
            <Card
              {...card}
              className={cn({
                'ring-4 ring-primary': selectedCards.has(card.uuid),
              })}
              isShowPlaying={false}
              onClick={!isReadOnly && canSelect ? () => handleCardClick(card.uuid) : undefined}
              variant="lg"
            />
            {cardsSubtitle?.[card.readableId] && (
              <Typography className="break-words text-center text-xs text-muted-foreground" variant="p">
                {cardsSubtitle[card.readableId]}
              </Typography>
            )}
          </div>
        ))}
      </div>

      {variants && variants.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-2">
          {variants.map(variant => (
            <Button
              className="whitespace-normal text-center"
              disabled={isReadOnly || !isAllCardsSelected}
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
