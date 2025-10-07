import { observer } from 'mobx-react-lite';

import stoneShardShirtImg from '@/assets/games/cryptoz/stone-shard-shirt.jpg';

interface TSizeProp {
  variant?: 'lg' | 'sm' | 'md';
}

export interface TStoneShardShirtProps extends TSizeProp {
  isShowShirt: true;
}

export const StoneShardShirt = observer(function StoneShardShirt() {
  return (
    <div
      className="size-full rounded-lg bg-black/20 bg-cover bg-center bg-no-repeat bg-blend-darken"
      style={{ backgroundImage: `url(${stoneShardShirtImg})` }}
    />
  );
});
