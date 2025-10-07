import _ from 'lodash';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import { AbstractCard } from '@/games/cryptoz/entities/Cards/AbstractCard';

import type { TCardPlayGeneralHandlerParams, TCardPlayTotalDarknessStrikeHandlerParams } from '../AbstractCard/types';

import { PlayerGroup } from '../../Players/PlayerGroup';

export class SmolderingPlague extends AbstractCard {
  constructor(room?: Room) {
    super({
      room,
      id: CryptozShared.ECardId.SMOLDERING_PLAGUE,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.smolderingPlague.name', 'ru'),
      price: 10,
      baseEssence: 2,
      gloryShards: 5,
      isSeal: false,
      hasEvade: false,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.smolderingPlague.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    totalStrike: t('cryptoz.cards.smolderingPlague.description.totalStrike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (!player || isForChaos) {
      return false;
    }

    player.addEssenceOnTurn(this.getEssence(2, player));

    const target = await this.room.socketService.selectTarget({
      player,
      targetsToSelect: this.room.players.getPlayersExceptPlayer(player),
      title: t('cryptoz.cards.smolderingPlague.modals.title.chooseTarget', 'ru'),
    });

    if (!target) {
      return false;
    }

    target.takeCardsToHand(1, this.room.cursedSeals);

    return true;
  };

  public canPlayStrikeHandler = () => false;
  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => true;

  protected playTotalDarknessStrikeHandler = async ({ target }: TCardPlayTotalDarknessStrikeHandlerParams) => {
    const targets = target
      ? new PlayerGroup([target])
      : this.room.players;

    await Promise.allSettled(targets.array.map(async targetPlayer => {
      if (targetPlayer.hand.count === 0) {
        this.logger.debug(`У участника ${targetPlayer.nickname} нет карт в руке`);
        return;
      }

      const cardsByType = new Map<CryptozShared.ECardType, AbstractCard[]>();

      targetPlayer.hand.array.forEach(card => {
        if (!cardsByType.has(card.type)) {
          cardsByType.set(card.type, []);
        }
        cardsByType.get(card.type)!.push(card);
      });

      for (const [type, cards] of cardsByType) {
        if (cards.length <= 1) {
          continue;
        }

        const cardGroup = new CardGroup(ECardGroupType.ANY, cards);

        const { cards: selectedCards } = await this.room.socketService.selectCards({
          player: targetPlayer,
          cards: cardGroup,
          variants: [{ id: 1, value: t('cryptoz.modals.variants.keep', 'ru') }],
          title: t('cryptoz.cards.smolderingPlague.modals.title.chooseCardToKeep', 'ru', {
            type: _.capitalize(type),
          }),
        });

        const cardToKeep = selectedCards.top || cardGroup.randomCard;
        if (cardToKeep) {
          targetPlayer.removeCards(cardGroup.getCardsExceptCard(cardToKeep), 'hand');
        }
      }
    }));

    return true;
  };

  protected onChangeOwner = () => {};

  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = () => Promise.resolve(false);
}
