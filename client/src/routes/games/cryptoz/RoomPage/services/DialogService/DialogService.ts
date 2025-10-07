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
  collapseDialog = (dialog: TCollapsedDialog) => {
    // Если уже есть свернутая модалка, закрываем её
    if (this.dialogStore.hasCollapsedDialog) {
      this.closeCollapsedDialog();
    }

    // Добавляем новую свернутую модалку
    this.dialogStore.setCollapsedDialog({
      ...dialog,
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
    this.dialogStore.removeDialog(this.dialogStore.activeDialog?.id || '');
    this.dialogStore.setCollapsedDialog(null);
  };

  // Обновление позиции свернутой модалки
  updateDialogPosition = (position: { x: number; y: number }) => {
    this.dialogStore.updateCollapsedDialogPosition(position);
  };
}
