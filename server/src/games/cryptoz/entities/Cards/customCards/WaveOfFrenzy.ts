import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class WaveOfFrenzy extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.WAVE_OF_FRENZY,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.waveOfFrenzy.name', 'ru'),
      price: 5,
      baseEssence: 0,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.waveOfFrenzy.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
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

    if (player.countStoneShards >= 3) {
      player.takeCards(3);
    } else {
      player.addEssenceOnTurn(this.getEssence(2, player));
    }

    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  protected playEvadeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);
}
