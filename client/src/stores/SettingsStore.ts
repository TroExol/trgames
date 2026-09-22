import { makeAutoObservable } from 'mobx';

import type { LocalStorageService } from '@/services/LocalStorageService';

interface TGeneralSettings {
  // Громкость одна на все игры. Музыка звучит сразу, но негромко: играют
  // в голосовом чате, где фон конкурирует с речью, и её чаще убавляют,
  // чем выключают
  volume: number;
}

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
  public general: TGeneralSettings = {
    volume: 0.35,
  };

  public cryptoz: TCryptozSettings = {
    showFullHandCards: false,
  };

  constructor(private readonly localStorageService: LocalStorageService) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadFromStorage();
  }

  public setVolume(value: number): void {
    this.general.volume = Math.min(Math.max(value, 0), 1);
    this.saveToStorage();
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
        const { volume } = general;

        if (typeof volume === 'number' && Number.isFinite(volume)) {
          this.general.volume = Math.min(Math.max(volume, 0), 1);
        }
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
      general: {
        volume: this.general.volume,
      },
      cryptoz: {
        showFullHandCards: this.cryptoz.showFullHandCards,
      },
    };

    this.localStorageService.set(STORAGE_KEY, JSON.stringify(payload));
  }
}
