import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ChaosH extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_H,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosH.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chaosH.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ concreteTargets }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;

    targets.array.forEach(player => {
      player.discardHand(player.hand);
      player.takeCardsToDiscard(player.deck, player.deck);
      player.takeCards(5);
    });

    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
