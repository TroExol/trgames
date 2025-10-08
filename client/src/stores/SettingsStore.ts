import { makeAutoObservable } from 'mobx';

type TGeneralSettings = Record<string, never>;

type TCryptozSettings = {
  showFullHandCards: boolean;
};

type TStoredSettings = {
  general?: Partial<TGeneralSettings>;
  cryptoz?: Partial<TCryptozSettings>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export class SettingsStore {
  private readonly storageKey = 'trgames:client-settings';

  public general: TGeneralSettings = {};

  public cryptoz: TCryptozSettings = {
    showFullHandCards: false,
  };

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  public setCryptozShowFullHandCards(value: boolean): void {
    this.cryptoz.showFullHandCards = value;
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }

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
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const payload: TStoredSettings = {
        general: this.general,
        cryptoz: {
          showFullHandCards: this.cryptoz.showFullHandCards,
        },
      };

      window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn('[SettingsStore] Не удалось сохранить настройки в localStorage.', error);
    }
  }
}
