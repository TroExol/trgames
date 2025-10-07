import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class MiriannaMoonEchoes extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.MIRIANNA_MOON_ECHOES,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.miriannaMoonEchoes.name', 'ru'),
      price: 3,
      baseEssence: 1,
      gloryShards: 1,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.miriannaMoonEchoes.description.general', 'ru', {
      count: this.getEssence(1, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.miriannaMoonEchoes.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(1, player));

    const target = await this.room.socketService.selectTarget({
      player,
      targetsToSelect: this.room.players.getPlayersExceptPlayer(player),
      title: t('cryptoz.cards.miriannaMoonEchoes.modals.title.chooseEnemy', 'ru'),
    });

    if (!target) {
      return false;
    }

    player.takeCards(1);
    target.takeCards(1);

    return true;
  };

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => true;

  protected playEvadeHandler = () => Promise.resolve(true);
}
