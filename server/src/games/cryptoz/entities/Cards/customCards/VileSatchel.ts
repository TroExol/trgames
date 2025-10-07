import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { CardGroup, ECardGroupType } from '../CardGroup';
import { AbstractCard, type TCardPlayGeneralHandlerParams } from '../AbstractCard';

export class VileSatchel extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.VILE_SATCHEL,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.ARTIFACT,
      name: t('cryptoz.cards.vileSatchel.name', 'ru'),
      price: 6,
      baseEssence: 3,
      gloryShards: 2,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.vileSatchel.description.general', 'ru', {
      count: this.getEssence(3, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.owner;

    if (!player || isForChaos) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(3, player));

    if (!player.deck.count) {
      player.fillDeck();
    }

    const topCard = player.deck.top;

    if (!topCard) {
      this.logger.debug('Не могу расскрыть карту, так как стопка пуста');
      return Promise.resolve(true);
    }

    this.room.socketService.showCards({
      players: this.room.playersAndViewers,
      cards: new CardGroup(ECardGroupType.ANY, [topCard]),
      title: t('cryptoz.modals.title.showCardsFromPlayerTopDeck', 'ru', {
        nickname: player.nickname,
        count: 1,
      }),
    });

    const healAmount = topCard.getPrice(null);
    player.heal(healAmount);

    return Promise.resolve(true);
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
