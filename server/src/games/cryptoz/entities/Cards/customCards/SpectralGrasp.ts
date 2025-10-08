import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';
import { Player } from '@/games/cryptoz/entities/Players/Player';
import { TurnEndedTrigger } from '@/games/cryptoz/customTriggers/TurnEndedTrigger';
import { CardTookTrigger } from '@/games/cryptoz/customTriggers/CardTookTrigger';
import { CardBoughtTrigger } from '@/games/cryptoz/customTriggers/CardBoughtTrigger';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class SpectralGrasp extends AbstractCard {
  private isCardTransferred = false;

  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.SPECTRAL_GRASP,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.spectralGrasp.name', 'ru'),
      price: 2,
      baseEssence: 1,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.spectralGrasp.description.general', 'ru', {
      count: this.getEssence(1, isSimple ? null : this.owner),
    }),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(1, player));

    const clearHandler = () => {
      player?.triggersOnTurnEnded.removeTriggerById(this.readableId);
      player?.triggersOnCardBought.removeTriggerById(this.readableId);
      player?.triggersOnCardTook.removeTriggerById(this.readableId);
    };

    const transferCard = (card: AbstractCard) => {
      this.isCardTransferred = true;

      const removeCard = () => {
        for (const player of this.room.players.array) {
          for (const zone of Player.CARD_ZONES) {
            if (player[zone].removeCard(card)) {
              return true;
            }
          }
        }
        if (this.room.removed.cards.removeCard(card)) {
          return true;
        }
        return !!this.room.deck.removeCard(card);
      };

      if (!removeCard()) {
        this.logger.warn('Не удалось найти карту после покупки или получения');
        return;
      }
      if (card.theSameType(CryptozShared.ECardType.CHAOS)) {
        this.room.removed.chaos.addCardToTop(card);
        return;
      }
      player?.deck.addCardToTop(card);
    };

    player?.triggersOnCardBought.addTrigger(new CardBoughtTrigger(this.readableId, card => {
      clearHandler();
      if (this.isCardTransferred) {
        return;
      }
      this.logger.debug('Покупка карты');
      transferCard(card);
    }));

    player?.triggersOnCardTook.addTrigger(new CardTookTrigger(this.readableId, (t, card, f, prevOwnerNickname) => {
      clearHandler();
      if (this.isCardTransferred || prevOwnerNickname === player?.nickname) {
        return;
      }
      this.logger.debug('Передача карты');
      transferCard(card);
    }));

    player?.triggersOnTurnEnded.addTrigger(new TurnEndedTrigger(this.readableId, () => {
      this.isCardTransferred = false;
      clearHandler();
    }));

    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};

  public canPlayStrikeHandler = () => false;

  protected playStrikeHandler = () => Promise.resolve(false);

  public canPlaySealHandler = () => false;

  protected playSealHandler = () => Promise.resolve(false);

  public canPlayTotalDarknessStrikeHandler = () => false;

  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
