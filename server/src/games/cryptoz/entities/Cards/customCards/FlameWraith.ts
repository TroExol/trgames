import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardEvadeHandlerParams, TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class FlameWraith extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.FLAME_WRAITH,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.COMPANION,
      name: t('cryptoz.cards.flameWraith.name', 'ru'),
      price: 6,
      baseEssence: 2,
      gloryShards: 2,
      isSeal: false,
      hasEvade: true,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.flameWraith.description.general', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    evade: t('cryptoz.cards.flameWraith.description.evade', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);
    if (isForChaos || !player) {
      return false;
    }
    player.addEssenceOnTurn(this.getEssence(2, player));
    if (player.deck.count < 2) {
      player.fillDeck();
    }
    const { cards, variant } = await this.room.socketService.selectCards({
      player,
      cards: player.deck.getCardsFromTop(2),
      variants: [
        { id: 1, value: t('cryptoz.modals.variants.remove', 'ru') },
        { id: 2, value: t('cryptoz.modals.variants.keep', 'ru') },
      ],
      title: t('cryptoz.modals.title.mayRemoveCardsFromDeck', 'ru', {
        count: 1,
      }),
    });
    if (!cards.count || variant === 2) {
      return true;
    }
    player.removeCards(cards, 'deck');
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
