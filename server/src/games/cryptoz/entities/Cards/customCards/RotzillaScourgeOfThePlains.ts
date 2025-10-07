import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardEvadeHandlerParams, TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class RotzillaScourgeOfThePlains extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.ROTZILLA_SCOURGE_OF_THE_PLAINS,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.COMPANION,
      name: t('cryptoz.cards.rotzillaScourgeOfThePlains.name', 'ru'),
      price: 6,
      baseEssence: 3,
      gloryShards: 2,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.rotzillaScourgeOfThePlains.description.general', 'ru', {
      count: this.getEssence(3, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.rotzillaScourgeOfThePlains.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);
    if (!player || isForChaos) {
      return false;
    }
    player.addEssenceOnTurn(this.getEssence(3, player));
    if (this.room.market.count < 1) {
      return true;
    }
    const { cards, variant } = await this.room.socketService.selectCards({
      player,
      cards: this.room.market,
      variants: [
        { id: 1, value: t('cryptoz.modals.variants.replace', 'ru') },
        { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
      ],
      title: t('cryptoz.cards.rotzillaScourgeOfThePlains.modals.title.replaceCardOnMarket', 'ru'),
    });
    if (!cards.top || variant === 2) {
      return true;
    }
    if (!this.room.market.removeCard(cards.top)) {
      return false;
    }
    this.room.removed.cards.addCardToTop(cards.top);
    while (true) {
      const topDeck = this.room.deck.removeCardsFromTop(1).top;
      if (!topDeck) {
        break;
      }
      if (topDeck.theSameType(CryptozShared.ECardType.CHAOS)) {
        this.room.deck.addCardToRandomPlace(topDeck);
        continue;
      }

      this.logger.info('Добавлена карта на рынок');
      this.room.market.addCardToTop(topDeck);
      break;
    }
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
    if (!this.owner.hand.count) {
      return true;
    }
    const { cards, variant } = await this.room.socketService.selectCards({
      player: this.owner,
      cards: this.owner.hand,
      variants: [
        { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
        { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
      ],
      title: t('cryptoz.modals.title.removeCardsFromHand', 'ru', {
        count: 1,
      }),
    });
    if (!cards.top || variant === 2) {
      return true;
    }
    this.owner.removeCards(cards, 'hand');
    return true;
  };
}
