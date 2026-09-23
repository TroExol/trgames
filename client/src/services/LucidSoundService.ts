import { autorun } from 'mobx';

import { settingsStore } from '@/stores';
import winUrl from '@/assets/games/lucid/sounds/win.ogg';
import stepUrl from '@/assets/games/lucid/sounds/step.ogg';
import resourceUpUrl from '@/assets/games/lucid/sounds/resource-up.ogg';
import resourceDownUrl from '@/assets/games/lucid/sounds/resource-down.ogg';
import eventUrl from '@/assets/games/lucid/sounds/event.ogg';
import diceUrl from '@/assets/games/lucid/sounds/dice.ogg';
import branchUrl from '@/assets/games/lucid/sounds/branch.ogg';
import lightMusicUrl from '@/assets/games/lucid/music/light.mp3';
import darkMusicUrl from '@/assets/games/lucid/music/dark.mp3';

// Озвучиваются ровно эти действия, остальное молчит: иначе выйдет не живо,
// а шумно. Файлы — паки Kenney под CC0
export type TLucidSound
  = | 'branch'
    | 'dice'
    | 'event'
    | 'resourceDown'
    | 'resourceUp'
    | 'step'
    | 'win';

export type TLucidMood = 'dark' | 'light';

const SOUND_URLS: Record<TLucidSound, string> = {
  branch: branchUrl,
  dice: diceUrl,
  event: eventUrl,
  resourceDown: resourceDownUrl,
  resourceUp: resourceUpUrl,
  step: stepUrl,
  win: winUrl,
};

const MUSIC_URLS: Record<TLucidMood, string> = {
  dark: darkMusicUrl,
  light: lightMusicUrl,
};

// Фон не должен спорить с речью в голосовом чате
const MUSIC_SHARE = 0.4;

// Звук через <audio>, а не через WebAudio: громкость, зацикливание и ленивая
// загрузка у элемента уже есть, а звуки идут раз в несколько секунд и никогда
// не накладываются — смешивать нечего
export class LucidSoundService {
  private sounds = new Map<TLucidSound, HTMLAudioElement>();

  private music?: HTMLAudioElement;

  // Дорожки весят по четыре с лишним мегабайта, поэтому грузится только та,
  // что подошла настроению темы, и только когда настроение уже известно
  private mood?: TLucidMood;

  constructor() {
    // Музыка играет непрерывно, поэтому её громкость и вкл/выкл приходится
    // применять на лету. Звуки действий канал и громкость не хранят вовсе —
    // спрашивают их в момент проигрывания
    autorun(() => {
      // Настройки читаются безусловно, до проверки this.music: иначе на первом
      // прогоне (музыка ещё не создана) autorun не подпишется ни на что и
      // больше никогда не перезапустится
      const { enabled, volume } = settingsStore.general.music;

      if (!this.music) {
        return;
      }

      this.music.volume = volume * MUSIC_SHARE;

      if (enabled) {
        // Тот же путь, что и у первого запуска: если браузер откажет
        // в автовоспроизведении, музыка всё равно возобновится по pointerdown,
        // а не замолчит до следующего изменения настроек
        this.start(this.music, 'music');
      } else {
        this.music.pause();
      }
    });
  }

  // Звуки короткие, их семь, и все они понадобятся за первые минуты партии:
  // грузятся разом при входе, чтобы первый бросок не молчал
  public preload = (): void => {
    Object.keys(SOUND_URLS).forEach(name => this.soundFor(name as TLucidSound));
  };

  public play = (name: TLucidSound): void => {
    // Проверка стоит здесь, а не в момент постановки звука в очередь: между
    // постановкой и проигрыванием игрок успевает выключить канал или
    // приглушить громкость
    const { enabled, volume } = settingsStore.general.ui;

    if (!enabled || volume === 0) {
      return;
    }

    const sound = this.soundFor(name);

    sound.volume = volume;
    // Звук мог не доиграть предыдущий раз: перематываем, иначе повтор
    // молча пропадёт
    sound.currentTime = 0;
    this.start(sound, 'ui');
  };

  public playMusic = (mood: TLucidMood): void => {
    if (this.mood === mood) {
      return;
    }

    this.stopMusic();
    this.mood = mood;

    const music = new Audio(MUSIC_URLS[mood]);
    const { enabled, volume } = settingsStore.general.music;

    music.loop = true;
    music.volume = volume * MUSIC_SHARE;
    this.music = music;

    if (enabled) {
      // Партия не ждёт загрузки: элемент играет, как только сможет
      this.start(music, 'music');
    }
  };

  public stopMusic = (): void => {
    this.music?.pause();
    this.music = undefined;
    this.mood = undefined;
  };

  // Своей копии громкости нет: копия рассинхронизировалась бы с настройками,
  // и звук зажил бы своей жизнью — приглушённый продолжал бы звучать
  private soundFor = (name: TLucidSound): HTMLAudioElement => {
    const existing = this.sounds.get(name);

    if (existing) {
      return existing;
    }

    const sound = new Audio(SOUND_URLS[name]);

    sound.preload = 'auto';
    sound.volume = settingsStore.general.ui.volume;
    this.sounds.set(name, sound);

    return sound;
  };

  // Браузер не пускает звук до первого действия человека. Вход в партию всё
  // равно начинается с нажатий, но после перезагрузки страницы посреди партии
  // нажатия ещё не было — тогда ждём ближайшего. Не удалось и так: молчим,
  // партия важнее звука. Канал передаётся явно, а не определяется сравнением
  // с this.music: к моменту pointerdown музыку могли уже переключить на другой
  // трек, и сравнение проверило бы настройки не того канала
  private start = (element: HTMLAudioElement, channel: 'music' | 'ui'): void => {
    element.play().catch(() => {
      document.addEventListener(
        'pointerdown',
        () => {
          // Пока звук ждал нажатия, игрок мог выключить канал или
          // приглушить его этим самым нажатием
          const { enabled, volume } = settingsStore.general[channel];

          if (!enabled || volume === 0) {
            return;
          }

          void element.play().catch(() => undefined);
        },
        { once: true },
      );
    });
  };
}

export const lucidSoundService = new LucidSoundService();
