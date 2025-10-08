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
    if (this.dialogStore.hasCollapsedDialog && this.dialogStore.activeDialog) {
      this.closeDialog(this.dialogStore.activeDialog.id);
    }

    const id = Math.random().toString(36).substr(2, 9);
    this.dialogStore.addDialog({ ...dialog, id, isCollapsed: false });
    return id;
  };

  // Закрытие модалки по ID
  closeDialog = (id: string) => {
    const dialog = this.dialogStore.getDialogById(id);
    if (dialog?.onClose) {
      dialog.onClose();
    }
    this.dialogStore.removeDialog(id);
    if (this.dialogStore.collapsedDialog?.id === id) {
      this.dialogStore.setCollapsedDialog(null);
    }
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
    const currentDialog = this.dialogStore.getDialogById(dialogId);
    if (!currentDialog) {
      return;
    }

    if (this.dialogStore.hasCollapsedDialog) {
      this.closeCollapsedDialog();
    }

    this.dialogStore.setDialogCollapsed(dialogId, true);
    this.dialogStore.setCollapsedDialog({
      id: dialogId,
      title: dialog.title || currentDialog.title || '',
      canClose: dialog.canClose ?? currentDialog.canClose,
      position: dialog.position || { x: 20, y: 20 },
    });
  };

  // Разворачивание модалки
  expandDialog = () => {
    const collapsedDialog = this.dialogStore.collapsedDialog;
    if (!collapsedDialog) {
      return;
    }

    if (this.dialogStore.activeDialog) {
      this.closeDialog(this.dialogStore.activeDialog.id);
    }

    this.dialogStore.setDialogCollapsed(collapsedDialog.id, false);
    this.dialogStore.setCollapsedDialog(null);
  };

  // Закрытие свернутой модалки
  closeCollapsedDialog = () => {
    const collapsedDialog = this.dialogStore.collapsedDialog;
    if (!collapsedDialog) {
      return;
    }

    this.closeDialog(collapsedDialog.id);
    this.dialogStore.setCollapsedDialog(null);
  };

  // Обновление позиции свернутой модалки
  updateDialogPosition = (position: { x: number; y: number }) => {
    this.dialogStore.updateCollapsedDialogPosition(position);
  };
}
