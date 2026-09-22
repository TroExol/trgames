import { LucidShared } from '@trgames/shared';

import { buildTrack, eventCellIds } from '@/games/lucid/core/track';
import { setupParty } from '@/games/lucid/core/setup';
import { applyMove as applyMoveToState } from '@/games/lucid/core/reducer';
import { createRandom, randomInt } from '@/games/lucid/core/random';
import { formatForPlayer } from '@/games/lucid/core/formatForPlayer';

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

interface TGenerateParams {
  theme: string;
  nicknames: string[];
  eventCellIds: number[];
  seed: string;
  onWorld: (theme: LucidShared.TTheme) => void;
}

interface TGenerateResult {
  content: LucidShared.TPartyContent;
  usedFallback: boolean;
}

interface TStartParams {
  generate: (params: TGenerateParams) => Promise<TGenerateResult>;
}

export interface TPartySnapshot {
  uuid: string;
  ownerId: LucidShared.TPlayerId;
  phase: LucidShared.EPartyPhase;
  members: TMember[];
  theme?: LucidShared.TTheme;
  state?: LucidShared.TState;
  usedFallback: boolean;
  sentRibbonLines: number;
  nextPartyId?: string;
}

export class Party {
  public readonly uuid: string;
  public readonly ownerId: LucidShared.TPlayerId;

  private phase: LucidShared.EPartyPhase = LucidShared.EPartyPhase.LOBBY;
  private readonly members = new Map<LucidShared.TPlayerId, TMember>();
  private theme?: LucidShared.TTheme;
  private state?: LucidShared.TState;
  private usedFallback = false;
  // Сколько строк журнала уже разослано. Лента — это его прирост,
  // а не журнал целиком: за сорок минут в нём накапливаются сотни строк
  private sentRibbonLines = 0;
  private readonly extraRibbonLines: string[] = [];
  // Куда уходить после победы, если с этой партии начали следующую
  private nextPartyId?: string;

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

  // Генерация передаётся параметром, а не берётся изнутри: так партия
  // проверяется без обращений к сети
  public start = async ({ generate }: TStartParams): Promise<void> => {
    if (!this.canStart) {
      throw new Error('cannot-start');
    }

    this.phase = LucidShared.EPartyPhase.GENERATING;

    const players = [...this.members.values()]
      .map(member => ({ id: member.playerId, nickname: member.nickname }));
    // Трек строится здесь ради номеров клеток событий, а внутри setupParty
    // соберётся заново из того же сида — построение детерминировано
    const track = buildTrack({
      random: createRandom(`${this.uuid}:track`),
      playerCount: players.length,
    });

    const { content, usedFallback } = await generate({
      theme: this.drawTheme(),
      nicknames: players.map(player => player.nickname),
      eventCellIds: eventCellIds(track),
      seed: this.uuid,
      onWorld: theme => {
        this.theme = theme;
      },
    });

    this.theme = content.theme;
    this.usedFallback = usedFallback;
    this.state = setupParty({ seed: this.uuid, players, content });
    this.phase = LucidShared.EPartyPhase.PLAYING;
  };

  public applyMove = (move: LucidShared.TMove): void => {
    if (!this.state || this.phase !== LucidShared.EPartyPhase.PLAYING) {
      return;
    }

    this.state = applyMoveToState(this.state, move);

    if (this.state.ctx.phase === LucidShared.EPhase.ENDED) {
      this.phase = LucidShared.EPartyPhase.ENDED;
    }
  };

  // Полное состояние нужно автопилоту: он выбирает ход по тому же состоянию,
  // по которому его проверяет движок
  public rawState = (): LucidShared.TState | undefined => this.state;

  public nicknameOf = (playerId: LucidShared.TPlayerId): string => {
    return this.members.get(playerId)?.nickname ?? '';
  };

  // Нужен проверке автопилота: ходит ли сейчас тот, кого нет на связи
  public isConnected = (playerId: LucidShared.TPlayerId): boolean => {
    return this.members.get(playerId)?.isConnected ?? false;
  };

  // Партия опустела, когда на связи нет никого. Пустое лобби, куда никто не
  // зашёл, пусто с рождения — и попадает под то же правило
  public get hasConnected(): boolean {
    return [...this.members.values()].some(member => member.isConnected);
  }

  // Строка от самой игры, а не от движка: например, честное признание,
  // что придумать мир не получилось
  public addRibbonLine = (line: string): void => {
    this.extraRibbonLines.push(line);
  };

  // С этой партии начали следующую тем же составом
  public setNextParty = (uuid: string): void => {
    this.nextPartyId = uuid;
  };

  public takeRibbonDelta = (): string[] => {
    const fromState = this.state?.G.log.slice(this.sentRibbonLines) ?? [];
    const delta = [...fromState, ...this.extraRibbonLines];

    this.sentRibbonLines += fromState.length;
    this.extraRibbonLines.length = 0;

    return delta;
  };

  // Снимок — это обычные данные: состояние партии проектировалось
  // сериализуемым именно ради этого
  public snapshot = (): TPartySnapshot => ({
    uuid: this.uuid,
    ownerId: this.ownerId,
    phase: this.phase,
    members: [...this.members.values()].map(member => ({ ...member })),
    theme: this.theme,
    state: this.state,
    usedFallback: this.usedFallback,
    sentRibbonLines: this.sentRibbonLines,
    nextPartyId: this.nextPartyId,
  });

  public static fromSnapshot = (snapshot: TPartySnapshot): Party => {
    const party = new Party({ uuid: snapshot.uuid, ownerId: snapshot.ownerId });

    party.phase = snapshot.phase;
    party.theme = snapshot.theme;
    party.state = snapshot.state;
    party.usedFallback = snapshot.usedFallback;
    party.sentRibbonLines = snapshot.sentRibbonLines;
    party.nextPartyId = snapshot.nextPartyId;
    // После перезапуска сервера соединений нет ни у кого: связь восстановится,
    // когда клиенты переподключатся
    snapshot.members.forEach(member => {
      party.members.set(member.playerId, { ...member, isConnected: false });
    });

    return party;
  };

  public view = (playerId: LucidShared.TPlayerId): LucidShared.TPartyView => ({
    partyId: this.uuid,
    phase: this.phase,
    members: [...this.members.values()].map(member => ({ ...member })),
    ownerId: this.ownerId,
    you: playerId,
    theme: this.theme,
    state: this.state ? formatForPlayer(this.state, playerId) : undefined,
    usedFallback: this.usedFallback,
    nextPartyId: this.nextPartyId,
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
