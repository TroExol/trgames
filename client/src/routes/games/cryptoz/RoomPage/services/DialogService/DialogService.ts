import type {
  DialogStore,
  TCollapsedDialog,
  TDialog,
} from '@/routes/games/cryptoz/RoomPage/stores/DialogStore';

export class DialogService {
  constructor(
    private readonly dialogStore: DialogStore,
  ) { }

  // Открытие модалки
  openDialog = (dialog: Omit<TDialog, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);

    if (this.dialogStore.hasCollapsedDialog && this.dialogStore.activeDialog) {
      this.closeDialog(this.dialogStore.activeDialog.id);
    }

    this.dialogStore.addDialog({ ...dialog, id });
    return id;
  };

  // Закрытие модалки по ID
  closeDialog = (id: string) => {
    const dialog = this.dialogStore.getDialogById(id);
    if (dialog?.onClose) {
      dialog.onClose();
    }
    this.dialogStore.removeDialog(id);
  };

  // Закрытие всех модалок
  closeAllDialogs = () => {
    this.dialogStore.dialogs.forEach(dialog => {
      if (dialog.onClose) {
        dialog.onClose();
      }
    });
    this.dialogStore.clearDialogs();
  };

  // Сворачивание модалки
  collapseDialog = (dialogId: string, dialog: Omit<TCollapsedDialog, 'id'>) => {
    const dialogToCollapse = this.dialogStore.getDialogById(dialogId);

    if (!dialogToCollapse) {
      return;
    }

    if (this.dialogStore.hasCollapsedDialog && this.dialogStore.collapsedDialog?.id !== dialogId) {
      this.closeCollapsedDialog();
    }

    this.dialogStore.setCollapsedDialog({
      ...dialog,
      id: dialogId,
      position: dialog.position || { x: 20, y: 20 },
    });
  };

  // Разворачивание модалки
  expandDialog = () => {
    this.dialogStore.collapsedDialog?.onExpand();
    this.dialogStore.setCollapsedDialog(null);
  };

  // Закрытие свернутой модалки
  closeCollapsedDialog = () => {
    const collapsedId = this.dialogStore.collapsedDialog?.id;

    if (collapsedId) {
      this.dialogStore.removeDialog(collapsedId);
    }

    this.dialogStore.setCollapsedDialog(null);
  };

  // Обновление позиции свернутой модалки
  updateDialogPosition = (position: { x: number; y: number }) => {
    this.dialogStore.updateCollapsedDialogPosition(position);
  };
}
