import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import type { LocalStorageService } from '@/services/LocalStorageService';

import { SettingsStore } from './SettingsStore';

// Фейковый localStorage: тестам нужен только get/set, без браузерного API
class FakeLocalStorageService implements Pick<LocalStorageService, 'get' | 'set' | 'remove'> {
  private readonly data = new Map<string, string>();

  public get(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  public set(key: string, value: string): void {
    this.data.set(key, value);
  }

  public remove(key: string): void {
    this.data.delete(key);
  }
}

describe('SettingsStore: звук', () => {
  let storage: FakeLocalStorageService;

  beforeEach(() => {
    storage = new FakeLocalStorageService();
  });

  it('по умолчанию оба канала включены и звучат на стартовой громкости', () => {
    const store = new SettingsStore(storage as unknown as LocalStorageService);

    expect(store.general.music.enabled).toBe(true);
    expect(store.general.ui.enabled).toBe(true);
    expect(store.general.music.volume).toBeCloseTo(0.35);
    expect(store.general.ui.volume).toBeCloseTo(0.35);
  });

  it('мигрирует старую общую громкость в оба канала', () => {
    storage.set('trgames:client-settings', JSON.stringify({ general: { volume: 0.8 } }));

    const store = new SettingsStore(storage as unknown as LocalStorageService);

    expect(store.general.music.volume).toBeCloseTo(0.8);
    expect(store.general.ui.volume).toBeCloseTo(0.8);
  });

  it('не трогает уже сохранённые раздельные каналы старым полем', () => {
    storage.set('trgames:client-settings', JSON.stringify({
      general: {
        volume: 0.9,
        music: { enabled: false, volume: 0.2 },
        ui: { enabled: true, volume: 0.6 },
      },
    }));

    const store = new SettingsStore(storage as unknown as LocalStorageService);

    expect(store.general.music).toEqual({ enabled: false, volume: 0.2 });
    expect(store.general.ui).toEqual({ enabled: true, volume: 0.6 });
  });

  it('громкости каналов независимы', () => {
    const store = new SettingsStore(storage as unknown as LocalStorageService);

    store.setMusicVolume(0.9);
    store.setUiSoundVolume(0.1);

    expect(store.general.music.volume).toBeCloseTo(0.9);
    expect(store.general.ui.volume).toBeCloseTo(0.1);
  });

  it('переключатели каналов независимы', () => {
    const store = new SettingsStore(storage as unknown as LocalStorageService);

    store.setMusicEnabled(false);

    expect(store.general.music.enabled).toBe(false);
    expect(store.general.ui.enabled).toBe(true);
  });

  it('сохранённое состояние переживает перезагрузку стора', () => {
    const first = new SettingsStore(storage as unknown as LocalStorageService);

    first.setMusicEnabled(false);
    first.setMusicVolume(0.5);
    first.setUiSoundVolume(0.7);

    const second = new SettingsStore(storage as unknown as LocalStorageService);

    expect(second.general.music).toEqual({ enabled: false, volume: 0.5 });
    expect(second.general.ui.volume).toBeCloseTo(0.7);
  });
});
