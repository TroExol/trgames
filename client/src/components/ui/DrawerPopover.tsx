import type { PopoverContentProps } from '@radix-ui/react-popover';

import React from 'react';

import { useDeviceWidth } from '@/hooks/useDeviceWidth';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/Drawer';

export interface TDrawerPopoverProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode;
  children: React.ReactNode;
  onOpenChange?: (isOpen: boolean) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  popoverContentProps?: PopoverContentProps;
  drawerContentProps?: React.ComponentPropsWithoutRef<typeof DrawerContent>;
}

export const DrawerPopover = React.forwardRef<HTMLButtonElement, TDrawerPopoverProps>(({
  title,
  description,
  content,
  children,
  onOpenChange,
  isOpen,
  setIsOpen,
  popoverContentProps = {},
  drawerContentProps = {},
}, ref) => {
  const { isSm } = useDeviceWidth();

  const handleOpenChange = (selectedIsOpen: boolean) => {
    setIsOpen(selectedIsOpen);
    onOpenChange?.(selectedIsOpen);
  };

  if (isSm) {
    return (
      <Popover onOpenChange={handleOpenChange} open={isOpen}>
        <PopoverTrigger asChild ref={ref}>
          {children}
        </PopoverTrigger>
        <PopoverContent {...popoverContentProps}>
          <div>{title}</div>
          <div>{description}</div>
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer onOpenChange={handleOpenChange} open={isOpen}>
      <DrawerTrigger asChild ref={ref}>
        {children}
      </DrawerTrigger>
      <DrawerContent
        aria-describedby={typeof description === 'string' ? description : undefined}
        {...drawerContentProps}
      >
        {(title || description) && (
          <DrawerHeader className="text-left">
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && (
              <DrawerDescription>
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
        )}
        {content}
      </DrawerContent>
    </Drawer>
  );
});
DrawerPopover.displayName = 'DrawerPopover';
