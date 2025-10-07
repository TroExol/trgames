import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class PrinceOfDecay extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.PRINCE_OF_DECAY,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.WICKEDNESS,
      name: t('cryptoz.cards.princeOfDecay.name', 'ru'),
      price: 4,
      baseEssence: 2,
      gloryShards: 1,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(2, isSimple ? null : this.owner),
    }),
    strike: t('cryptoz.cards.princeOfDecay.description.strike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(2, player));

    return true;
  };

  public canPlayStrikeHandler = () => true;

  protected playStrikeHandler = async ({ tempPlayer, isForChaos, canEvade }: TCardPlayStrikeHandlerParams) => {
    const player = tempPlayer ?? this.owner;

    if (isForChaos || !player) {
      return Promise.resolve(false);
    }

    const enemies = this.room.players.getPlayersExceptPlayer(player);

    await Promise.allSettled(enemies.array.map(async enemy => {
      if (enemy.hand.count <= 0) {
        return;
      }

      if (canEvade) {
        const isEvaded = await enemy.tryEvade({
          attacker: player,
          cardAttack: this,
          title: t('cryptoz.modals.title.willYouEvadeFromPlayer', 'ru', {
            nickname: player.nickname,
          }),
        });
        if (isEvaded) {
          return;
        }
      }

      const selected = await this.room.socketService.selectCards({
        player: enemy,
        cards: enemy.hand,
        variants: [{ id: 1, value: t('cryptoz.modals.variants.discard', 'ru') }],
        title: t('cryptoz.modals.title.discardCardsFromHand', 'ru', {
          count: 1,
        }),
      });

      if (selected.cards.count > 0) {
        enemy.discardHand(selected.cards);
      }
    }));

    return true;
  };

  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  protected onChangeOwner = () => {};
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  protected playEvadeHandler = () => Promise.resolve(false);
}
