import { makeAutoObservable } from 'mobx';

import type { LocalStorageService } from '@/services/LocalStorageService';

// Канал звука — переключатель и своя громкость, независимая от второго канала
interface TSoundChannelSettings {
  enabled: boolean;
  volume: number;
}

interface TGeneralSettings {
  // Музыка и звуки интерфейса регулируются раздельно: музыка фоновая
  // и негромкая по умолчанию (играют в голосовом чате, где она конкурирует
  // с речью), а короткие звуки действий — на своей громкости
  music: TSoundChannelSettings;
  ui: TSoundChannelSettings;
}

type TCryptozSettings = {
  showFullHandCards: boolean;
};

// Старый формат до разделения на два канала — общая громкость на всё
type TLegacyGeneralSettings = {
  volume?: number;
};

type TStoredSettings = {
  general?: Partial<TGeneralSettings> & TLegacyGeneralSettings;
  cryptoz?: Partial<TCryptozSettings>;
};

const STORAGE_KEY = 'trgames:client-settings';
const DEFAULT_VOLUME = 0.35;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const clampVolume = (value: number): number => Math.min(Math.max(value, 0), 1);

export class SettingsStore {
  public general: TGeneralSettings = {
    music: { enabled: true, volume: DEFAULT_VOLUME },
    ui: { enabled: true, volume: DEFAULT_VOLUME },
  };

  public cryptoz: TCryptozSettings = {
    showFullHandCards: false,
  };

  constructor(private readonly localStorageService: LocalStorageService) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadFromStorage();
  }

  public setMusicEnabled(value: boolean): void {
    this.general.music.enabled = value;
    this.saveToStorage();
  }

  public setMusicVolume(value: number): void {
    this.general.music.volume = clampVolume(value);
    this.saveToStorage();
  }

  public setUiSoundEnabled(value: boolean): void {
    this.general.ui.enabled = value;
    this.saveToStorage();
  }

  public setUiSoundVolume(value: number): void {
    this.general.ui.volume = clampVolume(value);
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
        this.loadChannel(general.music, this.general.music);
        this.loadChannel(general.ui, this.general.ui);

        // Старая общая громкость становится стартовой для обоих каналов —
        // только если сохранённых каналов ещё нет
        const { volume } = general;

        if (
          !isRecord(general.music) && !isRecord(general.ui)
          && typeof volume === 'number' && Number.isFinite(volume)
        ) {
          const migratedVolume = clampVolume(volume);

          this.general.music.volume = migratedVolume;
          this.general.ui.volume = migratedVolume;
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

  private loadChannel(raw: unknown, target: TSoundChannelSettings): void {
    if (!isRecord(raw)) {
      return;
    }

    const { enabled, volume } = raw;

    if (typeof enabled === 'boolean') {
      target.enabled = enabled;
    }

    if (typeof volume === 'number' && Number.isFinite(volume)) {
      target.volume = clampVolume(volume);
    }
  }

  private saveToStorage(): void {
    const payload: TStoredSettings = {
      general: {
        music: this.general.music,
        ui: this.general.ui,
      },
      cryptoz: {
        showFullHandCards: this.cryptoz.showFullHandCards,
      },
    };

    this.localStorageService.set(STORAGE_KEY, JSON.stringify(payload));
  }
}
