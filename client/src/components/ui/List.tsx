import type { FC } from 'react';
import type React from 'react';

import { observer } from 'mobx-react-lite';

import { cn } from '@/lib/utils';

interface TProps {
  className?: string;
  children: React.ReactNode;
}

export const List: FC<TProps> = observer(function List({
  children,
  className,
}) {
  return (
    <ul className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)}>
      {children}
    </ul>
  );
});
