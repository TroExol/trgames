import type { LucidShared } from '@trgames/shared';

import { makeAutoObservable } from 'mobx';

// Лента отвечает на вопрос «я отвлёкся, что я пропустил», а не хранит историю:
// старое уходит безвозвратно
const RIBBON_LIMIT = 4;

export type TConnection = 'connecting' | 'offline' | 'online';

export class PartyStore {
  public view?: LucidShared.TPartyView;

  public ribbon: string[] = [];

  // Сколько строк пришло за партию. Номер строки нужен ленте как ключ: без
  // него React переиспользует те же узлы, и проявится не новая строка, а все
  public ribbonTotal = 0;

  public connection: TConnection = 'connecting';

  public error?: string;

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

  public applyView(view: LucidShared.TPartyView): void {
    this.view = view;
  }

  public appendRibbon(lines: string[]): void {
    this.ribbonTotal += lines.length;
    this.ribbon = [...this.ribbon, ...lines].slice(-RIBBON_LIMIT);
  }

  public setConnection(connection: TConnection): void {
    this.connection = connection;
  }

  public setError(error?: string): void {
    this.error = error;
  }

  public reset(): void {
    this.view = undefined;
    this.ribbon = [];
    this.ribbonTotal = 0;
    this.connection = 'connecting';
    this.error = undefined;
  }
}

export const partyStore = new PartyStore();
