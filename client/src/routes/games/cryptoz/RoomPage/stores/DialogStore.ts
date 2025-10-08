import type { ReactNode } from 'react';

import { makeAutoObservable } from 'mobx';

export interface TDialog {
  id: string;
  content: ReactNode;
  title?: string;
  canClose?: boolean;
  canCollapse?: boolean;
  onClose?: () => void;
}

export interface TCollapsedDialog {
  id: string;
  title: string;
  onExpand: () => void;
  canClose?: boolean;
  position?: { x: number; y: number };
}

export class DialogStore {
  dialogs: TDialog[] = [];
  collapsedDialog: TCollapsedDialog | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Добавление модалки
  addDialog = (dialog: TDialog) => {
    this.dialogs.push(dialog);
  };

  // Удаление модалки по ID
  removeDialog = (id: string) => {
    if (this.collapsedDialog?.id === id) {
      this.collapsedDialog = null;
    }
    this.dialogs = this.dialogs.filter(d => d.id !== id);
  };

  // Очистка всех модалок
  clearDialogs = () => {
    this.dialogs = [];
    this.collapsedDialog = null;
  };

  // Установка свернутой модалки
  setCollapsedDialog = (dialog: TCollapsedDialog | null) => {
    this.collapsedDialog = dialog;
  };

  // Обновление позиции свернутой модалки
  updateCollapsedDialogPosition = (position: { x: number; y: number }) => {
    if (this.collapsedDialog) {
      this.collapsedDialog.position = position;
    }
  };

  // Получение активной модалки
  get activeDialog(): TDialog | null {
    const collapsedDialogId = this.collapsedDialog?.id;

    return this.dialogs.find(dialog => dialog.id !== collapsedDialogId) || null;
  }

  // Проверка наличия активных модалок
  get hasActiveDialogs() {
    return this.dialogs.some(dialog => dialog.id !== this.collapsedDialog?.id);
  }

  // Проверка наличия свернутой модалки
  get hasCollapsedDialog() {
    return this.collapsedDialog !== null;
  }

  // Признак, что действия внутри активных модалок должны быть отключены
  get isDialogActionsDisabled() {
    return this.hasCollapsedDialog;
  }

  // Признак блокировки игровых взаимодействий
  get isInteractionLocked() {
    return this.hasActiveDialogs || this.hasCollapsedDialog;
  }

  // Получение модалки по ID
  getDialogById = (id: string): TDialog | null => {
    return this.dialogs.find(d => d.id === id) || null;
  };
}
