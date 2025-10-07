import type { CryptozShared } from '@trgames/shared';

export interface TStoneShardsProps {
  stoneShards: CryptozShared.TStoneShard[];
  countStoneShardsToSelect?: number;
  variants?: CryptozShared.TVariant<string | number>[];
  onSubmit?: (id: string | number, stoneShards: CryptozShared.TStoneShard[]) => void;
}
