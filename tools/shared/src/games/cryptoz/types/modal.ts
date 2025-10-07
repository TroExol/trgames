import type { TVariant } from './variant';
import type { TStoneShard } from './stoneShard';
import type { TPlayer } from './player';
import type { TCard } from './card';
import type { TAbility } from './ability';

export enum EModalTypes {
  cards = 'cards',
  endGame = 'end-game',
  selectCards = 'select-cards',
  selectStartCards = 'select-start-cards',
  selectStoneShards = 'select-stone-shards',
  selectVariant = 'select-variant',
  stoneShards = 'stone-shards',
  suggestEvade = 'suggest-evade',
}

export type TModalParams<T extends EModalTypes> =
{ canClose?: boolean; canCollapse?: boolean } & (
    T extends EModalTypes.selectStartCards ? { companions: TCard[]; abilities: TAbility[] }
      : T extends EModalTypes.selectCards
        ? {
            cards: TCard[];
            title?: string;
            cardsSubtitle?: { [cardReadableId: string]: string };
            count: number | null;
            variants: TVariant<string | number>[];
          }
        : T extends EModalTypes.cards ? {
          cards: TCard[];
          title?: string;
          cardsSubtitle?: { [cardReadableId: string]: string };
        }
          : T extends EModalTypes.suggestEvade
            ? {
                cards: TCard[];
                cardAttack: TCard;
                cardsToShow?: TCard[];
                title?: string;
                variants: TVariant<number>[];
              }
            : T extends EModalTypes.selectStoneShards
              ? { stoneShards: TStoneShard[]; count: number; title?: string; variants: TVariant<string | number>[] }
              : T extends EModalTypes.selectVariant ? { title?: string; variants: TVariant<string | number>[] }
                : T extends EModalTypes.endGame ? { players: TPlayer[] }
                  : never);

export type TModalResponse<T extends EModalTypes> =
  T extends EModalTypes.selectStartCards
    ? { companion: TCard; ability: TAbility }
    : T extends EModalTypes.selectCards
      ? { selectedCards: TCard[]; variant?: number | string; closed?: never }
        | { closed: true }
      : T extends EModalTypes.suggestEvade
        ? { selectedCard: TCard; variant: number; closed?: never }
          | { closed: true }
        : T extends EModalTypes.selectStoneShards
          ? { selectedStoneShards: TStoneShard[]; variant?: number | string; closed?: never }
            | { closed: true }
          : T extends EModalTypes.selectVariant
            ? { variant?: TVariant<string | number>['id']; closed?: never }
              | { closed: true }
            : never;
