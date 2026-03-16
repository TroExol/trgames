import { makeAutoObservable } from 'mobx';

import type { LocalStorageService } from '@/services/LocalStorageService';

type TGeneralSettings = Record<string, never>;

type TCryptozSettings = {
  showFullHandCards: boolean;
};

type TStoredSettings = {
  general?: Partial<TGeneralSettings>;
  cryptoz?: Partial<TCryptozSettings>;
};

const STORAGE_KEY = 'trgames:client-settings';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export class SettingsStore {
  public general: TGeneralSettings = {};

  public cryptoz: TCryptozSettings = {
    showFullHandCards: false,
  };

  constructor(private readonly localStorageService: LocalStorageService) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadFromStorage();
  }

  public setCryptozShowFullHandCards(value: boolean): void {
    this.cryptoz.showFullHandCards = value;
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    const raw = this.localStorageService.get(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      if (!isRecord(parsed)) {
        return;
      }

      const { general, cryptoz } = parsed;

      if (isRecord(general)) {
        this.general = { ...this.general, ...general } as TGeneralSettings;
      }

      if (isRecord(cryptoz)) {
        const { showFullHandCards } = cryptoz;

        if (typeof showFullHandCards === 'boolean') {
          this.cryptoz.showFullHandCards = showFullHandCards;
        }
      }
    } catch (error) {
      console.warn('[SettingsStore] Не удалось загрузить настройки из localStorage.', error);
    }
  }

  private saveToStorage(): void {
    const payload: TStoredSettings = {
      general: this.general,
      cryptoz: {
        showFullHandCards: this.cryptoz.showFullHandCards,
      },
    };

    this.localStorageService.set(STORAGE_KEY, JSON.stringify(payload));
  }
}
