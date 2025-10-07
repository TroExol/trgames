import type React from 'react';
import type { FC } from 'react';

import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { cn } from '@/lib/utils';

interface TProps {
  url: string;
  cardImg: string;
  className: string;
  children: React.ReactNode;
}

export const BaseGameCard: FC<TProps> = observer(function BaseGameCard({
  url,
  cardImg,
  className,
  children,
}) {
  return (
    <Link
      className={cn(`rounded-3xl border-4 border-border
        bg-black/40  bg-cover bg-center bg-no-repeat
        p-20 text-center text-4xl font-bold bg-blend-darken
        transition-shadow hover:shadow-lg hover:shadow-accent`, className)}
      style={{ backgroundImage: `url(${cardImg})` }}
      to={url}
    >
      {children}
    </Link>
  );
});
