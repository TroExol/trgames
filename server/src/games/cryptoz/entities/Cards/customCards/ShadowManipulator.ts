import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardEvadeHandlerParams, TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';

export class ShadowManipulator extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.SHADOW_MANIPULATOR,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.COMPANION,
      name: t('cryptoz.cards.shadowManipulator.name', 'ru'),
      price: 6,
      baseEssence: 2,
      gloryShards: 2,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.shadowManipulator.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.shadowManipulator.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (!player) {
      return false;
    }
    if (!isForChaos) {
      player.addEssenceOnTurn(this.getEssence(2, player));
    }
    const randomChaos = this.room.removed.chaos.toShuffle().getCardsFromTop(2);
    if (!randomChaos.count) {
      return true;
    }
    const { cards, variant } = await this.room.socketService.selectCards({
      player,
      cards: randomChaos,
      title: t('cryptoz.cards.shadowManipulator.modals.title.chooseChaos', 'ru'),
      variants: [
        { id: 1, value: t('cryptoz.cards.shadowManipulator.modals.variants.takePart', 'ru') },
        { id: 2, value: t('cryptoz.cards.shadowManipulator.modals.variants.doNotTakePart', 'ru') },
      ],
    });
    const chaos = cards.top;
    if (!chaos) {
      return false;
    }

    this.room.socketService.showCards({
      players: this.room.playersAndViewers.getPlayersExceptPlayer(player),
      cards: new CardGroup(ECardGroupType.ANY, [chaos]),
      title: variant === 1
        ? t('cryptoz.cards.shadowManipulator.modals.title.chaosPlayingAndTakePart', 'ru', {
            nickname: player.nickname,
          })
        : t('cryptoz.cards.shadowManipulator.modals.title.chaosPlayingAndDoNotTakePart', 'ru', {
            nickname: player.nickname,
          }),
    });

    await chaos.play({
      concreteTargets: variant === 1
        ? this.room.players
        : this.room.players.getPlayersExceptPlayer(player),
    });
    return true;
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => true;

  public playEvadeHandler = async ({ attacker, cardAttack, damage }: TCardEvadeHandlerParams) => {
    if (!this.owner) {
      return false;
    }
    this.owner.takeCards(1);
    if (!attacker) {
      return false;
    }
    await cardAttack.playStrike({
      concreteDamage: damage,
      concreteTarget: attacker,
      tempPlayer: this.owner,
      canEvade: false,
      force: true,
    });
    return true;
  };
}
