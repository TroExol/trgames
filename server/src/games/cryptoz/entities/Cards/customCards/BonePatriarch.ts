import _ from 'lodash';
import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';
import type { Player } from '@/games/cryptoz/entities/Players/Player';

import { t } from '@/i18n';
import { CardBoughtTrigger } from '@/games/cryptoz/customTriggers/CardBoughtTrigger';

import type { TCardPlayGeneralHandlerParams, TCardPlayTotalDarknessStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';
import { PlayerGroup } from '../../Players/PlayerGroup';
import { AbilityGroup, EAbilityGroupType } from '../../Abilities/AbilityGroup';

export class BonePatriarch extends AbstractCard {
  private tempAbilities: { [playerNickname: string]: AbilityGroup<EAbilityGroupType.ANY> } = {};

  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.BONE_PATRIARCH,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.HARBINGER,
      name: t('cryptoz.cards.bonePatriarch.name', 'ru'),
      price: 10,
      baseEssence: 3,
      gloryShards: 5,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (isSimple: boolean): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.bonePatriarch.description.general', 'ru', {
      count: this.getEssence(3, isSimple ? null : this.owner),
    }),
    totalStrike: t('cryptoz.cards.bonePatriarch.description.totalStrike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({ tempPlayer, isForChaos }: TCardPlayGeneralHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (!player || isForChaos) {
      return Promise.resolve(false);
    }

    player.addEssenceOnTurn(this.getEssence(3, player));

    const ability = this.room.abilities.randomAbility;
    if (!ability) {
      return Promise.resolve(true);
    }
    if (!this.tempAbilities[player.nickname]) {
      this.tempAbilities[player.nickname] = new AbilityGroup(EAbilityGroupType.ANY);
    }
    this.tempAbilities[player.nickname].addAbilityToBottom(ability);

    this.room.socketService.showEntities({
      players: this.room.playersAndViewers,
      abilities: new AbilityGroup(EAbilityGroupType.ANY, [ability]),
      title: t('cryptoz.modals.title.randomAbilityTaken', 'ru', {
        nickname: player.nickname,
      }),
    });

    player.takeAbility(ability, this.room.abilities);

    this.room.players.array.forEach(p => {
      p.triggersOnCardBought.addTrigger(new CardBoughtTrigger(this.readableId, (card, price, boughtFrom) => {
        if (boughtFrom !== 'harbinger') {
          return;
        }

        this.room.players.array.forEach(p => {
          p.triggersOnCardBought.removeTriggerById(this.readableId);
        });

        if (!this.tempAbilities[player.nickname]) {
          return;
        }

        player.discardAbilities(this.tempAbilities[player.nickname]);
        delete this.tempAbilities[player.nickname];
      }));
    });

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
    const targets = target
      ? new PlayerGroup([target])
      : this.room.players;

    const minHealth = _.min(this.room.players.array.map(p => p.health)) ?? 1;

    await Promise.allSettled(targets.array.map(async (p: Player) => {
      const isEvaded = await p.tryEvade({
        cardAttack: this,
        title: t('cryptoz.modals.title.willYouEvadeTotalStrike', 'ru'),
      });

      if (!isEvaded) {
        p.health = minHealth;
      }
    }));

    return true;
  };

  public canPlayEvadeHandler = () => false;

  public playEvadeHandler = () => Promise.resolve(false);
}
