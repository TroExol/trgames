import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { CopyMinus, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    ref={ref}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  {
    showCloseButton?: boolean;
    showCollapseButton?: boolean;
    onCollapse?: () => void;
  }
  & React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, showCloseButton = true, showCollapseButton = false, onCollapse, ...props }, ref) => (
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            className={cn(
              'fixed left-1/2 top-[calc(50%+3.5rem)] z-50 grid max-h-[calc(100dvh-7rem)] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[calc(48%+3.5rem)] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[calc(48%+3.5rem)] sm:rounded-lg',
              className,
            )}
            ref={ref}
            {...props}
          >
            {children}
            {(showCloseButton || showCollapseButton) && (
              <div className="absolute right-4 top-4 flex items-center justify-center gap-2">
                {showCollapseButton && (
                  <button
                    className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    onClick={onCollapse}
                    type="button"
                  >
                    <CopyMinus className="size-5" />
                    <span className="sr-only">Свернуть</span>
                  </button>
                )}
                {showCloseButton && (
                  <DialogPrimitive.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="size-5" />
                    <span className="sr-only">Закрыть</span>
                  </DialogPrimitive.Close>
                )}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPortal>
      ));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = observer(({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className,
    )}
    {...props}
  />
));
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = observer(({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
));
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    className={cn(
      'text-center text-lg font-semibold leading-none tracking-tight',
      className,
    )}
    ref={ref}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    className={cn('text-md text-muted-foreground', className)}
    ref={ref}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
