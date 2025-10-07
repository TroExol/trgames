import _ from 'lodash';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard } from '../AbstractCard';

export class ChaosO extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_O,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosO.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chaosO.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({
    concreteTargets,
  }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;
    const allHandCards = new CardGroup(ECardGroupType.ANY);

    targets.array.forEach(target => {
      target.hand.array.forEach(card => {
        allHandCards.addCardToBottom(card);
      });
    });

    if (allHandCards.count === 0) {
      return Promise.resolve(true);
    }

    Object.entries(_.groupBy(allHandCards.array, 'ownerNickname'))
      .forEach(([ownerNickname, cards]) => {
        this.room.socketService.showCards({
          players: this.room.playersAndViewers.getPlayersExceptPlayer(cards[0].owner!),
          cards: new CardGroup(ECardGroupType.ANY, cards),
          title: t('cryptoz.modals.title.showPlayerHand', 'ru', { nickname: ownerNickname }),
        });
      });

    await Promise.allSettled(targets.array.map(async target => {
      if (target.hand.count === 0) {
        return;
      }

      const playStrikeHandlerParams: TCardPlayStrikeHandlerParams = {
        concreteTarget: target,
        isForChaos: true,
      };

      for (const card of target.hand.array) {
        if (card.canPlayStrikeHandler(playStrikeHandlerParams)) {
          await card.playStrike(playStrikeHandlerParams);
        }
      }
    }));

    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => false;
  protected playStrikeHandler = () => Promise.resolve(false);
  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = () => Promise.resolve(false);
  protected onChangeOwner = () => {};
}
