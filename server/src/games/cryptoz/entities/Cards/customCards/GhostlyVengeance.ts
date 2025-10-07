import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardEvadeHandlerParams, TCardPlayGeneralHandlerParams } from '../AbstractCard/types';

import { AbstractCard } from '../AbstractCard';

export class GhostlyVengeance extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.GHOSTLY_VENGEANCE,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.ghostlyVengeance.name', 'ru'),
      price: 4,
      baseEssence: 2,
      gloryShards: 1,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.ghostlyVengeance.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(2, player));
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = ({ attacker }: TCardEvadeHandlerParams) => {
    this.owner?.takeCards(1);
    attacker?.takeDamage(2, this.owner);
    return Promise.resolve(true);
  };
}
