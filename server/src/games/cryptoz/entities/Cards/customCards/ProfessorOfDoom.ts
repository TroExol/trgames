import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { CardGroup, ECardGroupType } from '@/games/cryptoz/entities/Cards/CardGroup';
import { EssenceModifier } from '@/games/cryptoz/customModifiers/EssenceModifier';

import type { TCardPlayGeneralHandlerParams, TCardPlayTotalDarknessStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class ProfessorOfDoom extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.PROFESSOR_OF_DOOM,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.professorOfDoom.name', 'ru'),
      price: 12,
      baseEssence: 0,
      gloryShards: 6,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.professorOfDoom.description.general', 'ru'),
    totalStrike: t('cryptoz.cards.professorOfDoom.description.totalStrike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (!player || isForChaos) {
      return Promise.resolve(false);
    }

    player.modifiersEssence.addModifier(
      new EssenceModifier(this.readableId, currentValue => currentValue * 2, { order: 9999 }),
    );

    return Promise.resolve(true);
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

      const cardsToDiscard = new CardGroup(ECardGroupType.ANY);
      targetPlayer.hand.array.forEach(card => {
        if (card.getPrice(targetPlayer) >= 5) {
          cardsToDiscard.addCardToTop(card);
        }
      });

      if (cardsToDiscard.count) {
        targetPlayer.discardHand(cardsToDiscard);
      }
    }));

    return true;
  };

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
