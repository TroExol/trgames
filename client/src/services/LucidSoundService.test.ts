import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { settingsStore } from '@/stores';

import { LucidSoundService } from './LucidSoundService';

// Фейковый <audio>: окружение тестов — node, DOM недоступен
class FakeAudio {
  public loop = false;

  public volume = 0;

  public currentTime = 0;

  public playing = false;

  public constructor(public src?: string) {}

  public play(): Promise<void> {
    this.playing = true;

    return Promise.resolve();
  }

  public pause(): void {
    this.playing = false;
  }
}

describe('LucidSoundService: каналы звука', () => {
  beforeEach(() => {
    vi.stubGlobal('Audio', FakeAudio);
    settingsStore.setMusicEnabled(true);
    settingsStore.setMusicVolume(0.35);
    settingsStore.setUiSoundEnabled(true);
    settingsStore.setUiSoundVolume(0.35);
  });

  it('выключенный канал звуков интерфейса молчит', () => {
    settingsStore.setUiSoundEnabled(false);

    const service = new LucidSoundService();

    service.play('dice');

    // Звук не должен был даже создаться — play() выходит раньше soundFor()
    expect((service as unknown as { sounds: Map<string, FakeAudio> }).sounds.size).toBe(0);
  });

  it('громкость 0 у звуков интерфейса тоже означает тишину', () => {
    settingsStore.setUiSoundVolume(0);

    const service = new LucidSoundService();

    service.play('dice');

    expect((service as unknown as { sounds: Map<string, FakeAudio> }).sounds.size).toBe(0);
  });

  it('выключенная музыка не запускается', () => {
    settingsStore.setMusicEnabled(false);

    const service = new LucidSoundService();

    service.playMusic('light');

    const music = (service as unknown as { music?: FakeAudio }).music;

    expect(music?.playing).toBeFalsy();
  });

  it('включённая музыка запускается и останавливается при выключении канала', async () => {
    const service = new LucidSoundService();

    service.playMusic('light');

    const music = (service as unknown as { music?: FakeAudio }).music;

    expect(music?.playing).toBe(true);

    settingsStore.setMusicEnabled(false);
    // autorun реагирует синхронно на изменение observable, но пауза внутри
    // промиса play() требует микротаска
    await Promise.resolve();

    expect(music?.playing).toBe(false);

    settingsStore.setMusicEnabled(true);
    await Promise.resolve();

    expect(music?.playing).toBe(true);
  });

  it('громкости каналов независимы во время проигрывания', () => {
    settingsStore.setMusicVolume(0.9);
    settingsStore.setUiSoundVolume(0.1);

    const service = new LucidSoundService();

    service.play('dice');

    const sound = (service as unknown as { sounds: Map<string, FakeAudio> }).sounds.get('dice');

    expect(sound?.volume).toBeCloseTo(0.1);

    service.playMusic('light');

    const music = (service as unknown as { music?: FakeAudio }).music;

    // Музыка играет тише: MUSIC_SHARE = 0.4
    expect(music?.volume).toBeCloseTo(0.36);
  });
});
