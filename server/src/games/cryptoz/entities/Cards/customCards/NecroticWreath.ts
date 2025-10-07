import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class NecroticWreath extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.NECROTIC_WREATH,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.necroticWreath.name', 'ru'),
      price: 7,
      baseEssence: 5,
      gloryShards: 2,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(5, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = (params: TCardPlayGeneralHandlerParams) => {
    const {
      tempPlayer,
      isForChaos,
    } = params;

    if (isForChaos) {
      return Promise.resolve(false);
    }

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(5, player));
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  protected playEvadeHandler = () => Promise.resolve(false);
}
