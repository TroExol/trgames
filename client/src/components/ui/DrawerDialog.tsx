import type { DialogContentProps } from '@radix-ui/react-dialog';

import React from 'react';

import { useDeviceWidth } from '@/hooks/useDeviceWidth';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/Drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';

export interface TDrawerDialogProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode;
  children: React.ReactNode;
  onOpenChange?: (isOpen: boolean) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  dialogContentProps?: DialogContentProps;
  drawerContentProps?: React.ComponentPropsWithoutRef<typeof DrawerContent>;
}

export const DrawerDialog = React.forwardRef<HTMLButtonElement, TDrawerDialogProps>(({
  title,
  description,
  content,
  children,
  onOpenChange,
  isOpen,
  setIsOpen,
  dialogContentProps = {},
  drawerContentProps = {},
}, ref) => {
  const { isSm } = useDeviceWidth();

  const handleOpenChange = (selectedIsOpen: boolean) => {
    setIsOpen(selectedIsOpen);
    onOpenChange?.(selectedIsOpen);
  };

  if (isSm) {
    return (
      <Dialog onOpenChange={handleOpenChange} open={isOpen}>
        <DialogTrigger asChild ref={ref}>
          {children}
        </DialogTrigger>
        <DialogContent aria-describedby={typeof description === 'string' ? description : undefined} {...dialogContentProps}>
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && (
                <DialogDescription>
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          )}
          {content}
        </DialogContent>
      </Dialog>
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
DrawerDialog.displayName = 'DrawerDialog';
