import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard/types';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';

export class WyrmGemOfPower extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.WYRM_GEM_OF_POWER,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.wyrmGemOfPower.name', 'ru'),
      price: 5,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: true,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.heal', 'ru', {
      count: this.getHeal(3, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.descriptions.takeCardsFromHand', 'ru', {
      count: 1,
    }),
    other: t('cryptoz.cards.wyrmGemOfPower.description.other', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (!player || isForChaos) {
      return Promise.resolve(false);
    }

    player.heal(this.getHeal(3, player));

    return Promise.resolve(true);
  };
  public canPlayEvadeHandler = () => true;

  protected playEvadeHandler = () => {
    if (!this.owner) {
      return Promise.resolve(false);
    }

    this.owner.discardSeal(new CardGroup(ECardGroupType.ANY, [this]));
    this.owner.takeCards(1);

    return Promise.resolve(true);
  };

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public getGloryShards = (): typeof this.baseGloryShards => {
    if (!this.owner) {
      return this.baseGloryShards;
    }

    const count = this.owner.allCards.getCountCardsById(CryptozShared.ECardId.WYRM_GEM_OF_POWER);

    if (count >= 2) {
      return 5;
    }

    return this.baseGloryShards;
  };
}
