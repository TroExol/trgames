import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams, TCardPlayStrikeHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';

export class ArtOfTheDead extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.ART_OF_THE_DEAD,
      target: CryptozShared.ECardTarget.ENEMY,
      type: CryptozShared.ECardType.RITUAL,
      name: t('cryptoz.cards.artOfTheDead.name', 'ru'),
      price: 6,
      baseEssence: 3,
      gloryShards: 2,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.descriptions.addEssence', 'ru', {
      count: this.getEssence(3, this.owner),
    }),
    strike: t('cryptoz.cards.artOfTheDead.description.strike', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = ({
    tempPlayer,
    isForChaos,
  }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.owner;
    if (isForChaos || !player) {
      return Promise.resolve(false);
    }
    player.addEssenceOnTurn(this.getEssence(3, player));
    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = ({ tempPlayer }: TCardPlayStrikeHandlerParams) => {
    const player = tempPlayer ?? this.owner;
    if (!player) return false;
    // Проверяем наличие Великого Костяка
    return !!player.seals.getCardById(CryptozShared.ECardId.GREAT_SKELETON);
  };

  protected playStrikeHandler = async ({
    concreteTarget,
    tempPlayer,
    isForChaos,
    canEvade,
  }: TCardPlayStrikeHandlerParams): Promise<boolean> => {
    const player = tempPlayer ?? this.owner;
    if (
      isForChaos
      || !player
      || !player.seals.getCardById(CryptozShared.ECardId.GREAT_SKELETON)
    ) {
      return false;
    }

    // Выбираем противника
    const enemy = concreteTarget ?? await this.room.socketService.selectTarget({
      player,
      targetsToSelect: this.room.players.getPlayersExceptPlayer(player),
      title: t('cryptoz.cards.artOfTheDead.modals.title.chooseStoneShardToChange', 'ru'),
    });

    if (!enemy) return false;

    if (canEvade) {
      const isEvaded = await enemy.tryEvade({
        attacker: player,
        cardAttack: this,
        title: t('cryptoz.cards.artOfTheDead.modals.title.playerTryToChangeStoneShards', 'ru', {
          nickname: player.nickname,
        }),
      });
      if (isEvaded) {
        return true;
      }
    }

    // Выбираем осколок у противника
    const { stoneShards: enemySelectedShards } = await this.room.socketService.selectStoneShards({
      player,
      stoneShards: enemy.stoneShards,
      title: t('cryptoz.cards.artOfTheDead.modals.title.chooseStoneShardToChangeEnemy', 'ru', {
        nickname: enemy.nickname,
      }),
      variants: [{ id: 1, value: t('cryptoz.modals.variants.choose', 'ru') }],
    });

    // Выбираем свой осколок
    const { stoneShards: playerSelectedShards } = await this.room.socketService.selectStoneShards({
      player,
      stoneShards: player.stoneShards,
      title: t('cryptoz.cards.artOfTheDead.modals.title.chooseStoneShardToChangePlayer', 'ru'),
      variants: [{ id: 1, value: t('cryptoz.modals.variants.choose', 'ru') }],
    });

    const enemyStoneShard = enemySelectedShards.array[0];
    const playerStoneShard = playerSelectedShards.array[0];

    if (!enemyStoneShard || !playerStoneShard) return false;

    // Меняемся осколками
    const enemyShards = enemy.stoneShards.clone();
    const playerShards = player.stoneShards.clone();
    enemy.discardStoneShard(enemySelectedShards);
    player.discardStoneShard(playerSelectedShards);
    await player.takeStoneShard(enemyStoneShard, enemyShards);
    await enemy.takeStoneShard(playerStoneShard, playerShards);

    return true;
  };

  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  protected playEvadeHandler = () => Promise.resolve(false);
  protected onChangeOwner = () => {};
}
