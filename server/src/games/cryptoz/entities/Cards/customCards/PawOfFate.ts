import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class PawOfFate extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.PAW_OF_FATE,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.pawOfFate.name', 'ru'),
      price: 2,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.pawOfFate.description.general', 'ru', {
      count: this.getHeal(2, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({
    tempPlayer,
    isForChaos,
  }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.owner;
    if (isForChaos || !player) {
      return Promise.resolve(false);
    }
    player.takeCards(1);
    player.heal(this.getHeal(2, player));
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => false;
  protected playStrikeHandler = async () => Promise.resolve(false);
  public canPlaySealHandler = () => false;
  protected playSealHandler = async () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = async () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  protected playEvadeHandler = async () => Promise.resolve(false);
  protected onChangeOwner = () => {};
}
