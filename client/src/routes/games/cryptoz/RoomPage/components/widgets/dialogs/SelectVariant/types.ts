import type { CryptozShared } from '@trgames/shared';

export interface TSelectVariantProps {
  title: string;
  variants: CryptozShared.TVariant<string | number>[];
  onSubmit: (id: string | number) => void;
  onClose?: () => void;
  canClose?: boolean;
  canCollapse?: boolean;
}
