import { observer } from 'mobx-react-lite';
import { X } from 'lucide-react';

import { dialogStore } from '@/routes/games/cryptoz/RoomPage/stores';
import { dialogService } from '@/routes/games/cryptoz/RoomPage/services';
import { CollapsibleDialog } from '@/routes/games/cryptoz/RoomPage/components/features/CollapsibleDialog';

export const DialogProvider = observer(function DialogProvider() {
  const { activeDialog, collapsedDialog } = dialogStore;

  return (
    <>
      {/* Активные модалки */}
      {activeDialog && (
        <CollapsibleDialog
          canClose={activeDialog.canClose}
          canCollapse={activeDialog.canCollapse}
          key={activeDialog.id}
          onClose={() => dialogService.closeDialog(activeDialog.id)}
          title={activeDialog.title || ''}
        >
          {activeDialog.content}
        </CollapsibleDialog>
      )}

      {/* Свернутая модалка */}
      {collapsedDialog && (
        <div
          className="fixed z-50 flex cursor-pointer items-center gap-2 rounded-md bg-background p-2 shadow-lg ring-2 ring-ring"
          onClick={dialogService.expandDialog}
          style={{
            left: collapsedDialog.position?.x || 20,
            top: collapsedDialog.position?.y || 20,
          }}
        >
          <span className="text-md font-medium">{collapsedDialog.title}</span>
          {collapsedDialog.canClose && (
            <button
              className="rounded p-1 transition-colors hover:bg-accent"
              onClick={e => {
                e.stopPropagation();
                dialogService.closeCollapsedDialog();
              }}
              title="Закрыть"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}
    </>
  );
});
