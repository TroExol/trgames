import { CryptozShared } from '@trgames/shared';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import type { TCardPlayGeneralHandlerParams } from '../AbstractCard';

import { AbstractCard } from '../AbstractCard';
import { EStoneShardGroupType, StoneShardGroup } from '../../StoneShards/StoneShardGroup';
import { PlayerGroup } from '../../Players/PlayerGroup';

export class ChaosR extends AbstractCard {
  constructor(room?: Room) {
    super({
      id: CryptozShared.ECardId.CHAOS_R,
      target: CryptozShared.ECardTarget.UNDEFINED,
      type: CryptozShared.ECardType.CHAOS,
      name: t('cryptoz.cards.chaosR.name', 'ru'),
      price: 0,
      baseEssence: 0,
      gloryShards: 0,
      isSeal: false,
      hasEvade: false,
      room,
    });
  }

  protected getDescription = (): CryptozShared.TCard['description'] => ({
    general: t('cryptoz.cards.chaosR.description.general', 'ru'),
  });

  public canPlayGeneralHandler = () => true;

  protected playGeneralHandler = async ({
    concreteTargets,
    tempPlayer,
  }: TCardPlayGeneralHandlerParams): Promise<boolean> => {
    const targets = concreteTargets ?? this.room.players;
    const player = tempPlayer ?? this.room.activePlayer;

    if (!player) {
      return Promise.resolve(false);
    }

    const allStoneShards = new StoneShardGroup(EStoneShardGroupType.ANY);
    const chooseStoneShardTargets = new PlayerGroup();

    await Promise.allSettled(targets.array.map(async target => {
      if (target.stoneShards.count === 0) {
        return;
      }

      const { stoneShards } = await this.room.socketService.selectStoneShards({
        player: target,
        stoneShards: target.stoneShards,
        variants: [{ id: 1, value: t('cryptoz.modals.variants.choose', 'ru') }],
        title: t('cryptoz.cards.chaosR.modals.title.chooseStoneShard', 'ru'),
        canClose: false,
      });

      const selectedStoneShard = stoneShards.top;
      if (!selectedStoneShard) {
        return;
      }

      target.stoneShards.removeStoneShard(selectedStoneShard);

      allStoneShards.addStoneShardToBottom(selectedStoneShard);
      chooseStoneShardTargets.addPlayerToBottom(target);
    }));

    if (!allStoneShards.count) {
      return Promise.resolve(true);
    }

    allStoneShards.shuffle();

    const shuffledArray = [...allStoneShards.array];

    for (const target of chooseStoneShardTargets.array) {
      const stoneShard = shuffledArray.pop();
      if (stoneShard) {
        await target.takeStoneShard(stoneShard, allStoneShards);
      }
    }

    return Promise.resolve(true);
  };

  public canPlayStrikeHandler = () => false;
  protected playStrikeHandler = () => Promise.resolve(false);
  public canPlaySealHandler = () => false;
  protected playSealHandler = () => Promise.resolve(false);
  public canPlayTotalDarknessStrikeHandler = () => false;
  protected playTotalDarknessStrikeHandler = () => Promise.resolve(false);
  public canPlayEvadeHandler = () => false;
  public playEvadeHandler = () => Promise.resolve(false);
  protected onChangeOwner = () => {};
}
