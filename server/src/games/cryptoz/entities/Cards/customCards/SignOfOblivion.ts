import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayTotalDarknessStrikeHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class SignOfOblivion extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.SIGN_OF_OBLIVION,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.signOfOblivion.name', 'ru'),
      price: 10,
      baseEssence: 0,
      gloryShards: 5,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.signOfOblivion.description.general', 'ru'),
    totalStrike: t('cryptoz.cards.signOfOblivion.description.totalStrike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (!player) {
      return false;
    }

    const randomChaos = this.room.removed.chaos.randomCard;
    if (!randomChaos) {
      return true;
    }

    const { variant } = await this.room.socketService.selectCards({
      player,
      cards: new CardGroup(ECardGroupType.ANY, [randomChaos]),
      title: t('cryptoz.cards.signOfOblivion.modals.title.randomChaos', 'ru'),
      variants: [
        { id: 1, value: t('cryptoz.cards.signOfOblivion.modals.variants.takePart', 'ru') },
        { id: 2, value: t('cryptoz.cards.signOfOblivion.modals.variants.doNotTakePart', 'ru') },
      ],
    });

    this.room.socketService.showCards({
      players: this.room.playersAndViewers.getPlayersExceptPlayer(player),
      cards: new CardGroup(ECardGroupType.ANY, [randomChaos]),
      title: variant === 1
        ? t('cryptoz.cards.signOfOblivion.modals.title.chaosPlayingAndTakePart', 'ru', {
            nickname: player.nickname,
          })
        : t('cryptoz.cards.signOfOblivion.modals.title.chaosPlayingAndDoNotTakePart', 'ru', {
            nickname: player.nickname,
          }),
    });

    await randomChaos.play({
      tempPlayer: player,
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

  public canPlayTotalDarknessStrikeHandler = () => true;

  protected playTotalDarknessStrikeHandler = async ({
    target,
  }: TCardPlayTotalDarknessStrikeHandlerParams) => {
    const playersToAttack = target
      ? new PlayerGroup([target])
      : this.room.players;

    await Promise.allSettled(playersToAttack.array.map(async (targetPlayer: Player) => {
      const isEvaded = await targetPlayer.tryEvade({
        cardAttack: this,
        title: t('cryptoz.modals.title.willYouEvadeTotalStrike', 'ru'),
      });

      if (isEvaded) {
        return;
      }

      if (targetPlayer.hand.count > 0) {
        const { cards } = await this.room.socketService.selectCards({
          player: targetPlayer,
          cards: targetPlayer.hand,
          title: t('cryptoz.modals.title.discardCardsFromHand', 'ru', {
            count: 2,
          }),
          count: 2,
          variants: [{ id: 1, value: t('cryptoz.modals.variants.discard', 'ru') }],
        });
        targetPlayer.discardHand(cards);
      }

      if (targetPlayer.seals.count > 0) {
        const { cards } = await this.room.socketService.selectCards({
          player: targetPlayer,
          cards: targetPlayer.seals,
          title: t('cryptoz.modals.title.discardSeals', 'ru', {
            count: 1,
          }),
          variants: [{ id: 1, value: t('cryptoz.modals.variants.discard', 'ru') }],
        });
        targetPlayer.discardSeal(cards);
      }
    }));

    return true;
  };

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
