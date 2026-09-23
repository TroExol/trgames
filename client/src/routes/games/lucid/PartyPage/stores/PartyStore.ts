import type { LucidShared } from '@trgames/shared';

import { makeAutoObservable } from 'mobx';

import { lucidSoundService } from '@/services/LucidSoundService';
import { walkPath } from '@/lib/lucid/walkPath';

import { isNewRoll } from './rollReveal';

// Лента отвечает на вопрос «я отвлёкся, что я пропустил», а не хранит историю:
// старое уходит безвозвратно
const RIBBON_LIMIT = 4;

// Тайминги показа броска (задача 1, docs/lucid/PRD.md — «Показ броска»):
// кубик катится, потом держит выпавшее значение, потом фишка идёт по клеткам
const ROLL_SPIN_MS = 700;
const ROLL_SETTLE_MS = 500;
const REDUCED_PAUSE_MS = 400;
const STEP_MS = 150;

export type TConnection = 'connecting' | 'offline' | 'online';

// idle — кубик показывает уже применённый G.lastRoll (или пуст). spinning —
// перебирает грани, значение ещё не известно зрителю. settled — держит
// выпавшее значение, но G ещё не применён (позиции, карточка, лента — старые)
export type TDicePhase = 'idle' | 'spinning' | 'settled';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export class PartyStore {
  // То, что видит игрок прямо сейчас — не всегда последний пришедший вид:
  // пока идёт показ броска, здесь остаётся предыдущее состояние (см. applyView)
  public view?: LucidShared.TPartyView;

  public ribbon: string[] = [];

  // Сколько строк пришло за партию. Номер строки нужен ленте как ключ: без
  // него React переиспользует те же узлы, и проявится не новая строка, а все
  public ribbonTotal = 0;

  // Строки, пришедшие, пока идёт показ броска: appendRibbon — отдельное
  // сокет-событие, сервер шлёт его после update-party (init.ts::broadcast),
  // но оно всё равно обгоняет применение view, потому что view для нового
  // броска специально задерживается (см. applyView). Без буфера лента
  // спойлерила бы бросок текстом раньше кубика («Ваня выбрасывает 5» во
  // время перебора граней) — копится здесь и выходит разом с тем view,
  // который в итоге применяется
  private pendingRibbon: string[] = [];

  public connection: TConnection = 'connecting';

  public error?: string;

  public dicePhase: TDicePhase = 'idle';

  // Бросок, который сейчас катится/держится кубиком, пока view ещё не применён
  public pendingRoll?: LucidShared.TRoll;

  // stateId финального view последнего показа броска: звуки 'dice'/'step' по
  // нему уже отыграны здесь же, по ходу показа (reveal/walkSteps) — PartyPage
  // сверяет свой снимок состояния с этим полем, чтобы не озвучить их ещё раз
  // диффом при коммите того же view
  public revealedStateId?: number;

  private timers: number[] = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get state(): LucidShared.TStateForPlayer | undefined {
    return this.view?.state;
  }

  public get isMyTurn(): boolean {
    return Boolean(this.state && this.state.ctx.currentPlayer === this.state.you);
  }

  public get isOwner(): boolean {
    return Boolean(this.view && this.view.ownerId === this.view.you);
  }

  // Идёт показ броска или пошагового хода — кнопки хода должны молчать,
  // иначе нажатие уйдёт по устаревшему, ещё не применённому виду
  public get isRevealing(): boolean {
    return this.dicePhase !== 'idle';
  }

  // Новое состояние с новым броском (ROLL хода или порог варианта — оба пишут
  // G.lastRoll) не применяется сразу: сначала кубик катится и показывает
  // значение, потом фишка идёт по клеткам, и только тогда view сменяется —
  // остальной интерфейс (карточка события, итог, лента) читает view, поэтому
  // ничего больше делать не нужно. Первое состояние партии (подключение,
  // восстановление) и ходы без нового броска (развилка) применяются сразу.
  // Несколько пришедших подряд состояний не копятся в очередь — новый вызов
  // обрывает текущий показ и досказывает историю по-новой от последнего
  // показанного к самому свежему пришедшему: очередь честнее показала бы
  // каждый бросок, но при частых состояниях (автопилот на несколько игроков)
  // копится растущее отставание, а обрыв и досказ всегда возвращают к
  // актуальному виду за фиксированное время
  public applyView(view: LucidShared.TPartyView): void {
    const previous = this.view;

    if (previous?.state && view.state && isNewRoll(previous.state.G.lastRoll, view.state.G.lastRoll)) {
      this.reveal(previous, view);

      return;
    }

    this.clearTimers();
    this.dicePhase = 'idle';
    this.pendingRoll = undefined;
    this.view = view;
    this.flushRibbon();
  }

  // Пока идёт показ (isRevealing), строки копятся в pendingRibbon и выходят
  // вместе с view, который их описывает — см. комментарий у pendingRibbon
  public appendRibbon(lines: string[]): void {
    this.pendingRibbon = [...this.pendingRibbon, ...lines];

    if (!this.isRevealing) {
      this.flushRibbon();
    }
  }

  public setConnection(connection: TConnection): void {
    this.connection = connection;
  }

  public setError(error?: string): void {
    this.error = error;
  }

  public reset(): void {
    this.clearTimers();
    this.view = undefined;
    this.ribbon = [];
    this.ribbonTotal = 0;
    this.connection = 'connecting';
    this.error = undefined;
    this.dicePhase = 'idle';
    this.pendingRoll = undefined;
    this.pendingRibbon = [];
    this.revealedStateId = undefined;
  }

  private flushRibbon(): void {
    if (this.pendingRibbon.length === 0) {
      return;
    }

    const lines = this.pendingRibbon;

    this.pendingRibbon = [];
    this.ribbonTotal += lines.length;
    this.ribbon = [...this.ribbon, ...lines].slice(-RIBBON_LIMIT);
  }

  private reveal(previous: LucidShared.TPartyView, incoming: LucidShared.TPartyView): void {
    this.clearTimers();

    const roll = incoming.state!.G.lastRoll!;
    const reduced = prefersReducedMotion();

    this.pendingRoll = roll;
    this.dicePhase = reduced ? 'settled' : 'spinning';
    // Звук броска — здесь, в начале показа, а не при финальном применении
    // view (тогда он звучал бы на 1.2 с позже самого броска). settled сразу
    // при reduced — единственная фаза, которую в этом случае увидит зритель
    lucidSoundService.play('dice');

    if (reduced) {
      this.schedule(REDUCED_PAUSE_MS, () => this.finishReveal(previous, incoming, roll, reduced));

      return;
    }

    this.schedule(ROLL_SPIN_MS, () => {
      this.dicePhase = 'settled';
      this.schedule(ROLL_SETTLE_MS, () => this.finishReveal(previous, incoming, roll, reduced));
    });
  }

  private finishReveal(
    previous: LucidShared.TPartyView,
    incoming: LucidShared.TPartyView,
    roll: LucidShared.TRoll,
    reduced: boolean,
  ): void {
    this.pendingRoll = undefined;
    this.dicePhase = 'idle';

    const from = previous.state?.G.players[roll.playerId]?.position;
    // Только бросок хода (не порог варианта) двигает по известному прямому
    // пути: движение эффектом (MOVE с минусом), обмен и всё остальное после
    // порога — путь неочевиден, там достаточно одного плавного перехода
    // (его даёт CSS-переход токена в Board)
    const path = !reduced && roll.threshold === undefined && previous.state && from !== undefined
      ? walkPath(previous.state.G.track, from, roll.value)
      : [];

    if (path.length === 0) {
      this.view = incoming;
      this.revealedStateId = incoming.state!.stateId;
      this.flushRibbon();

      return;
    }

    this.walkSteps(previous, incoming, roll.playerId, path, 0);
  }

  private walkSteps(
    previous: LucidShared.TPartyView,
    incoming: LucidShared.TPartyView,
    playerId: LucidShared.TPlayerId,
    path: number[],
    index: number,
  ): void {
    const baseState = previous.state!;
    const cellId = path[index];

    this.view = {
      ...previous,
      state: {
        ...baseState,
        G: {
          ...baseState.G,
          players: {
            ...baseState.G.players,
            [playerId]: { ...baseState.G.players[playerId], position: cellId },
          },
        },
      },
    };
    // Каждая клетка пути — свой шаг звука: stateId у промежуточного view не
    // меняется (см. комментарий у walkPath.ts выше по файлу), поэтому диф
    // состояний в PartyPage его не увидит — озвучиваем прямо тут
    lucidSoundService.play('step');

    const isLast = index + 1 >= path.length;

    this.schedule(STEP_MS, () => {
      if (isLast) {
        this.view = incoming;
        this.revealedStateId = incoming.state!.stateId;
        this.flushRibbon();
      } else {
        this.walkSteps(previous, incoming, playerId, path, index + 1);
      }
    });
  }

  private schedule(ms: number, fn: () => void): void {
    this.timers.push(window.setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timers.forEach(timer => window.clearTimeout(timer));
    this.timers = [];
  }
}

export const partyStore = new PartyStore();
