import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';

import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';

export class ToxicBonechewer extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.TOXIC_BONECHEWER,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CREATURE,
      name: t('cryptoz.cards.toxicBonechewer.name', 'ru'),
      price: 3,
      baseEssence: 1,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.toxicBonechewer.description.general', 'ru', {
      count: this.getEssence(1, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async (params: TCardPlayGeneralHandlerParams) => {
    const {
      tempPlayer,
      isForChaos,
    } = params;

    if (isForChaos) {
      return false;
    }

    const player = tempPlayer ?? this.owner;
    this.logger.debug(`Разыгрывает ${player?.nickname}`);

    if (!player) {
      return false;
    }

    player.addEssenceOnTurn(this.getEssence(1, player));

    if (!player.deck.count) {
      player.fillDeck();
    }

    if (!player.deck.top) {
      return true;
    }

    const { cards, variant } = await this.room.socketService.selectCards({
      cards: new CardGroup(ECardGroupType.ANY, [player.deck.top]),
      player,
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

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  protected onChangeOwner = () => {};

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
