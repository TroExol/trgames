import { LucidShared } from '@trgames/shared';

import { createRandom, randomInt } from '@/games/lucid/core/random';

const MAX_THEME_LENGTH = 200;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;

// Для тех случаев, когда не предложил никто
export const THEME_HINTS = [
  'заброшенная космическая станция',
  'пираты южных морей',
  'офис перед сдачей квартального отчёта',
  'киберпанковые трущобы',
  'экспедиция во льдах',
];

interface TPartyConstructorParams {
  uuid: string;
  ownerId: LucidShared.TPlayerId;
}

interface TJoinParams {
  playerId: LucidShared.TPlayerId;
  nickname: string;
}

export interface TMember {
  playerId: LucidShared.TPlayerId;
  nickname: string;
  isConnected: boolean;
  hasAnswered: boolean;
  themeProposal?: string;
}

export class Party {
  public readonly uuid: string;
  public readonly ownerId: LucidShared.TPlayerId;

  private phase: LucidShared.EPartyPhase = LucidShared.EPartyPhase.LOBBY;
  private readonly members = new Map<LucidShared.TPlayerId, TMember>();
  private theme?: LucidShared.TTheme;
  private state?: LucidShared.TState;
  private usedFallback = false;

  constructor({ uuid, ownerId }: TPartyConstructorParams) {
    this.uuid = uuid;
    this.ownerId = ownerId;
  }

  public get isFull(): boolean {
    return this.members.size >= MAX_PLAYERS;
  }

  public get canStart(): boolean {
    return this.phase === LucidShared.EPartyPhase.LOBBY && this.members.size >= MIN_PLAYERS;
  }

  public join = ({ playerId, nickname }: TJoinParams): void => {
    const trimmed = nickname.trim();

    if (!trimmed) {
      throw new Error('empty-nickname');
    }

    // Ник опознаёт игрока для людей, а не для системы: повторы запрещены,
    // иначе игроки не смогут однозначно говорить друг о друге
    const taken = [...this.members.values()]
      .some(member => member.playerId !== playerId && member.nickname === trimmed);

    if (taken) {
      throw new Error('nickname-taken');
    }

    const existing = this.members.get(playerId);

    if (existing) {
      // Тот же игрок вернулся: место и ответ про тему сохраняются,
      // обновляется только подпись и связь
      existing.nickname = trimmed;
      existing.isConnected = true;

      return;
    }

    if (this.phase !== LucidShared.EPartyPhase.LOBBY) {
      throw new Error('party-already-started');
    }

    if (this.isFull) {
      throw new Error('party-is-full');
    }

    this.members.set(playerId, {
      playerId,
      nickname: trimmed,
      isConnected: true,
      hasAnswered: false,
    });
  };

  public disconnect = (playerId: LucidShared.TPlayerId): void => {
    const member = this.members.get(playerId);

    if (member) {
      member.isConnected = false;
    }
  };

  public proposeTheme = (playerId: LucidShared.TPlayerId, theme: string): void => {
    const member = this.requireLobbyMember(playerId);
    const trimmed = theme.trim();

    if (!trimmed) {
      throw new Error('empty-theme');
    }

    if (trimmed.length > MAX_THEME_LENGTH) {
      throw new Error('theme-too-long');
    }

    member.themeProposal = trimmed;
    member.hasAnswered = true;
  };

  public declineTheme = (playerId: LucidShared.TPlayerId): void => {
    const member = this.requireLobbyMember(playerId);

    member.themeProposal = undefined;
    member.hasAnswered = true;
  };

  // Тему выбирает кубик, а не создатель партии: мир игрокам не выбирается,
  // он им достаётся. Сид взят от партии, поэтому жеребьёвка воспроизводима
  public drawTheme = (): string => {
    const proposals = [...this.members.values()]
      .map(member => member.themeProposal)
      .filter((theme): theme is string => Boolean(theme));
    const pool = proposals.length > 0 ? proposals : THEME_HINTS;
    const picked = randomInt(createRandom(`${this.uuid}:theme`), 0, pool.length - 1);

    return pool[picked.value];
  };

  public view = (playerId: LucidShared.TPlayerId): LucidShared.TPartyView => ({
    partyId: this.uuid,
    phase: this.phase,
    members: [...this.members.values()].map(member => ({ ...member })),
    ownerId: this.ownerId,
    you: playerId,
    theme: this.theme,
    state: undefined,
    usedFallback: this.usedFallback,
  });

  private requireLobbyMember = (playerId: LucidShared.TPlayerId): TMember => {
    if (this.phase !== LucidShared.EPartyPhase.LOBBY) {
      throw new Error('party-already-started');
    }

    const member = this.members.get(playerId);

    if (!member) {
      throw new Error('not-a-member');
    }

    return member;
  };
}
