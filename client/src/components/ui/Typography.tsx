import type { FC } from 'react';
import type React from 'react';

import { observer } from 'mobx-react-lite';
import { cva } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

interface TProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'blockquote' | 'inline-code' | 'lead' | 'large' | 'small' | 'muted';
  className?: string;
  children: React.ReactNode;
  asChild?: boolean;
}

const typographyVariants = cva(
  '',
  {
    variants: {
      variant: {
        'h1': 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
        'h2': 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
        'h3': 'scroll-m-20 text-2xl font-semibold tracking-tight',
        'h4': 'scroll-m-20 text-xl font-semibold tracking-tight',
        'p': '',
        'blockquote': 'mt-6 border-l-2 pl-6 italic',
        'inline-code': 'text-md relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold',
        'lead': 'text-xl text-muted-foreground',
        'large': 'text-lg font-semibold',
        'small': 'text-sm font-medium leading-none',
        'muted': 'text-md text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'p',
    },
  },
);

export const Typography: FC<TProps> = observer(function Typography({
  variant,
  children,
  className,
  asChild = false,
}) {
  let component = '';

  if (['h1', 'h2', 'h3', 'h4', 'p', 'blockquote'].includes(variant)) {
    component = variant;
  } else if (variant === 'inline-code') {
    component = 'code';
  } else if (variant === 'lead') {
    component = 'p';
  } else if (variant === 'large') {
    component = 'div';
  } else if (variant === 'small') {
    component = 'small';
  } else if (variant === 'muted') {
    component = 'p';
  }

  const Comp = asChild ? Slot : component;
  return (
    <Comp className={cn(typographyVariants({ variant, className }))}>
      {children}
    </Comp>
  );
});
