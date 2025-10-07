import _ from 'lodash';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { EStoneShardGroupType, StoneShardGroup } from './StoneShardGroup';
import { StoneShard20 } from './customStoneShards/StoneShard20';
import { StoneShard19 } from './customStoneShards/StoneShard19';
import { StoneShard18 } from './customStoneShards/StoneShard18';
import { StoneShard17 } from './customStoneShards/StoneShard17';
import { StoneShard16 } from './customStoneShards/StoneShard16';
import { StoneShard15 } from './customStoneShards/StoneShard15';
import { StoneShard14 } from './customStoneShards/StoneShard14';
import { StoneShard13 } from './customStoneShards/StoneShard13';
import { StoneShard12 } from './customStoneShards/StoneShard12';
import { StoneShard11 } from './customStoneShards/StoneShard11';
import { StoneShard10 } from './customStoneShards/StoneShard10';
import { StoneShard9 } from './customStoneShards/StoneShard9';
import { StoneShard8 } from './customStoneShards/StoneShard8';
import { StoneShard7 } from './customStoneShards/StoneShard7';
import { StoneShard6 } from './customStoneShards/StoneShard6';
import { StoneShard5 } from './customStoneShards/StoneShard5';
import { StoneShard4 } from './customStoneShards/StoneShard4';
import { StoneShard3 } from './customStoneShards/StoneShard3';
import { StoneShard2 } from './customStoneShards/StoneShard2';
import { StoneShard1 } from './customStoneShards/StoneShard1';

export const getInitialStoneShardMasterDeck = ({
  maxPlayers,
  room,
}: { maxPlayers?: number; room?: Room } = {}): StoneShardGroup<EStoneShardGroupType.MASTER_DECK> => {
  const countCopies = 1 + +((maxPlayers ?? 0) > 6);
  const stoneShards: StoneShardGroup<EStoneShardGroupType.ANY> = new StoneShardGroup(EStoneShardGroupType.MASTER_DECK);

  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard1(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard2(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard3(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard4(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard5(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard6(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard7(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard8(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard9(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard10(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard11(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard12(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard13(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard14(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard15(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard16(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard17(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard18(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard19(room)));
  _.times(countCopies, () => stoneShards.addStoneShardToBottom(new StoneShard20(room)));

  stoneShards.shuffle();
  return stoneShards;
};
