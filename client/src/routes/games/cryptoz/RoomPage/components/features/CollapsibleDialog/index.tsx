import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { dialogService } from '@/routes/games/cryptoz/RoomPage/services';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

import type { TCollapsibleDialogProps } from './types';

export const CollapsibleDialog = observer(function CollapsibleDialog({
  dialogId,
  title,
  canClose = true,
  canCollapse = true,
  children,
  onClose,
}: TCollapsibleDialogProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleOpenChange = (open: boolean) => {
    if (!canClose) {
      return;
    }
    setIsOpen(open);
    if (!open) {
      onClose?.();
    }
  };

  const handleCollapse = () => {
    dialogService.collapseDialog(dialogId, {
      title,
      onExpand: () => setIsOpen(true),
      canClose,
    });
    setIsOpen(false);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogContent
        onCollapse={handleCollapse}
        showCloseButton={canClose}
        showCollapseButton={canCollapse}
      >
        <DialogHeader>
          <DialogTitle>
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
});
