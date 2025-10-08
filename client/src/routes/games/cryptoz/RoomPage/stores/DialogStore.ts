import type { ReactNode } from 'react';

import { makeAutoObservable } from 'mobx';

export interface TDialog {
  id: string;
  content: ReactNode;
  title?: string;
  canClose?: boolean;
  canCollapse?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
}

export interface TCollapsedDialog {
  id: string;
  title: string;
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

  // Обновление признака сворачивания модалки
  setDialogCollapsed = (id: string, isCollapsed: boolean) => {
    const dialog = this.getDialogById(id);
    if (dialog) {
      dialog.isCollapsed = isCollapsed;
    }
  };

  // Обновление позиции свернутой модалки
  updateCollapsedDialogPosition = (position: { x: number; y: number }) => {
    if (this.collapsedDialog) {
      this.collapsedDialog.position = position;
    }
  };

  // Получение активной модалки
  get activeDialog(): TDialog | null {
    return this.dialogs.find(dialog => !dialog.isCollapsed) || null;
  }

  // Проверка наличия активных модалок
  get hasActiveDialogs() {
    return this.activeDialog !== null;
  }

  // Проверка наличия свернутой модалки
  get hasCollapsedDialog() {
    return this.collapsedDialog !== null;
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
