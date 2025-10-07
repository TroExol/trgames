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
    this.dialogs = this.dialogs.filter(d => d.id !== id);
  };

  // Очистка всех модалок
  clearDialogs = () => {
    this.dialogs = [];
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
    return this.dialogs[0] || null;
  }

  // Проверка наличия активных модалок
  get hasActiveDialogs() {
    return this.dialogs.length > 0;
  }

  // Проверка наличия свернутой модалки
  get hasCollapsedDialog() {
    return this.collapsedDialog !== null;
  }

  // Получение модалки по ID
  getDialogById = (id: string): TDialog | null => {
    return this.dialogs.find(d => d.id === id) || null;
  };
}
