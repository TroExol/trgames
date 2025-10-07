import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard, type TCardEvadeHandlerParams } from '../AbstractCard';

export class OblivionChalice extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.OBLIVION_CHALICE,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.oblivionChalice.name', 'ru'),
      price: 6,
      baseEssence: 3,
      gloryShards: 2,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(3, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.oblivionChalice.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(3, player));
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = ({ attacker }: TCardEvadeHandlerParams) => {
    this.owner?.takeCards(1);
    attacker?.takeDamage(5, this.owner);
    return Promise.resolve(true);
  };
}
