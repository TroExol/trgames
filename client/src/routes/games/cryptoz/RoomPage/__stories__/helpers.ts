import { CryptozShared } from '@trgames/shared';

import {
  dialogStore,
  logsStore,
  messagesStore,
  roomStore,
} from '@/routes/games/cryptoz/RoomPage/stores';
import { socketService } from '@/routes/games/cryptoz/RoomPage/services';

let isSocketMocked = false;

const ensureSocketMocks = () => {
  if (isSocketMocked) {
    return;
  }

  socketService.sendMessage = message => {
    void message;
  };
  socketService.playCard = card => {
    void card;
  };
  socketService.playAbility = ability => {
    void ability;
  };
  socketService.toggleReady = () => undefined;
  socketService.removePlayer = nickname => {
    void nickname;
  };
  socketService.buyMarketCard = card => {
    void card;
  };
  socketService.buyCompanion = () => undefined;
  socketService.buyHarbinger = () => undefined;
  socketService.buyDarknessMadness = () => undefined;
  socketService.endTurn = () => undefined;
  socketService.close = () => undefined;
  socketService.connect = () => Promise.resolve();
  socketService.socket = {
    connected: true,
    on: () => socketService.socket!,
    off: () => socketService.socket!,
  } as unknown as typeof socketService.socket;

  isSocketMocked = true;
};

export const createMockCard = (
  overrides: Partial<CryptozShared.TCard> = {},
): CryptozShared.TCard => ({
  uuid: overrides.uuid ?? `card-${Math.random().toString(36).slice(2, 8)}`,
  id: overrides.id ?? CryptozShared.ECardId.ABYSSAL_CONSCIOUSNESS,
  readableId: overrides.readableId ?? '001',
  name: overrides.name ?? 'Бездна сознания',
  description: overrides.description ?? {
    general: 'Вызовите древнего ужасного существа.',
    strike: 'Нанесите 2 урона.',
  },
  simpleDescription: overrides.simpleDescription ?? {
    general: 'Общее описание.',
  },
  target: overrides.target ?? CryptozShared.ECardTarget.ENEMY,
  type: overrides.type ?? CryptozShared.ECardType.CREATURE,
  basePrice: overrides.basePrice ?? 2,
  baseEssence: overrides.baseEssence ?? 1,
  baseGloryShards: overrides.baseGloryShards ?? 0,
  price: overrides.price ?? overrides.basePrice ?? 2,
  essence: overrides.essence ?? overrides.baseEssence ?? 1,
  gloryShards: overrides.gloryShards ?? overrides.baseGloryShards ?? 0,
  isSeal: overrides.isSeal ?? false,
  isPlayingGeneral: overrides.isPlayingGeneral ?? false,
  isPlayingStrike: overrides.isPlayingStrike ?? false,
  isPlayingEvade: overrides.isPlayingEvade ?? false,
  isPlayingTotalStrike: overrides.isPlayingTotalStrike ?? false,
  isPlayingSeal: overrides.isPlayingSeal ?? false,
  ownerNickname: overrides.ownerNickname ?? undefined,
});

export const createMockAbility = (
  overrides: Partial<CryptozShared.TAbility> = {},
): CryptozShared.TAbility => ({
  uuid: overrides.uuid ?? `ability-${Math.random().toString(36).slice(2, 8)}`,
  id: overrides.id ?? 1,
  description: overrides.description ?? 'Позволяет изменить ход сражения.',
  canPlayHandler: overrides.canPlayHandler ?? true,
  isPlaying: overrides.isPlaying ?? false,
  isPlayed: overrides.isPlayed ?? false,
  ownerNickname: overrides.ownerNickname ?? undefined,
});

export const createMockStoneShard = (
  overrides: Partial<CryptozShared.TStoneShard> = {},
): CryptozShared.TStoneShard => ({
  uuid: overrides.uuid ?? `stone-${Math.random().toString(36).slice(2, 8)}`,
  id: overrides.id ?? 1,
  description: overrides.description ?? 'Используйте осколок для усиления.',
  ownerNickname: overrides.ownerNickname ?? undefined,
});

export const createMockPlayer = (
  overrides: Partial<CryptozShared.TPlayer> = {},
): CryptozShared.TPlayer => {
  const nickname = overrides.nickname ?? 'Участник';
  const hand = overrides.hand ?? [
    createMockCard({ uuid: 'hand-1', name: 'Укус тени', price: 3 }),
    createMockCard({ uuid: 'hand-2', name: 'Кулак судьбы', price: 2 }),
    createMockCard({ uuid: 'hand-3', name: 'Охотник туманов', price: 4 }),
  ];

  return {
    nickname,
    health: overrides.health ?? 12,
    gloryShards: overrides.gloryShards ?? 3,
    hasDarknessCrown: overrides.hasDarknessCrown ?? false,
    hasNoctullos: overrides.hasNoctullos ?? false,
    isOnline: overrides.isOnline ?? true,
    abilities: overrides.abilities ?? [
      createMockAbility({ uuid: 'ability-1', description: 'Поменяйте порядок карт в сбросе.' }),
      createMockAbility({ uuid: 'ability-2', description: 'Получите 2 сущности.' }),
    ],
    countDeck: overrides.countDeck ?? 18,
    countHand: overrides.countHand ?? hand.length,
    hand,
    discard: overrides.discard ?? [
      createMockCard({ uuid: 'discard-1', name: 'Прах ночи', price: 1 }),
    ],
    seals: overrides.seals ?? [
      createMockCard({
        uuid: 'seal-1',
        name: 'Печать пустоты',
        type: CryptozShared.ECardType.CURSED_SEAL,
        isSeal: true,
      }),
    ],
    stoneShards: overrides.stoneShards ?? [
      createMockStoneShard({ uuid: 'stone-1' }),
      createMockStoneShard({ uuid: 'stone-2', id: 2 }),
    ],
    companion: overrides.companion ?? createMockCard({
      uuid: 'companion-1',
      name: 'Слуга сумрака',
      type: CryptozShared.ECardType.COMPANION,
      price: 5,
    }),
    arena: overrides.arena ?? [
      createMockCard({ uuid: 'arena-1', name: 'Танец призраков' }),
    ],
    essenceToSpend: overrides.essenceToSpend ?? 6,
    essenceOfHand: overrides.essenceOfHand ?? 3,
    isReady: overrides.isReady ?? false,
    ...overrides,
  };
};

export const createMockMessage = (
  overrides: Partial<CryptozShared.TMessage> = {},
): CryptozShared.TMessage => ({
  uuid: overrides.uuid ?? 'message-' + Math.random().toString(36).slice(2, 8),
  message: overrides.message ?? 'Привет, готов к следующему раунду?',
  date: overrides.date ?? new Date().toISOString(),
  senderNickname: overrides.senderNickname ?? 'Летописец',
  senderParticipant: overrides.senderParticipant ?? 'player',
});

export const createMockLog = (
  overrides: Partial<CryptozShared.TLog> = {},
): CryptozShared.TLog => ({
  uuid: overrides.uuid ?? 'log-' + Math.random().toString(36).slice(2, 8),
  message: overrides.message ?? 'Участник разыграл карту «Укус тени».',
  date: overrides.date ?? new Date().toISOString(),
});

export const createMockRoom = (
  overrides: Partial<CryptozShared.TRoom> = {},
): CryptozShared.TRoom => {
  const players = overrides.players ?? [createMockPlayer({ nickname: 'Аделина' }), createMockPlayer({ nickname: 'Виктор' })];
  const activePlayerNickname = overrides.activePlayerNickname ?? players[0]?.nickname ?? 'Аделина';
  const playerNickname = overrides.playerNickname ?? players[0]?.nickname ?? 'Аделина';

  return {
    uuid: overrides.uuid ?? 'room-1',
    name: overrides.name ?? 'Комната криптоз',
    adminNickname: overrides.adminNickname ?? players[0]?.nickname ?? 'Аделина',
    playerNickname,
    activePlayerNickname,
    isGameStarted: overrides.isGameStarted ?? true,
    isGameEnded: overrides.isGameEnded ?? false,
    startedAt: overrides.startedAt ?? Date.now() - 1000 * 60 * 5,
    endedAt: overrides.endedAt,
    countDeck: overrides.countDeck ?? 32,
    countHarbingers: overrides.countHarbingers ?? 3,
    countViewers: overrides.countViewers ?? 1,
    harbinger: overrides.harbinger ?? createMockCard({
      uuid: 'harbinger-1',
      name: 'Вестник ночи',
      type: CryptozShared.ECardType.HARBINGER,
      price: 6,
    }),
    darknessCrown: overrides.darknessCrown ?? {
      name: 'Корона тьмы',
      description: 'Корона, которой владеет текущий лидер мрака.',
      isPlaying: false,
    },
    activeChaos: overrides.activeChaos,
    players,
    abilities: overrides.abilities ?? players[0]?.abilities ?? [],
    removed: overrides.removed ?? {
      cards: [createMockCard({ uuid: 'removed-card-1', name: 'Забытый ритуал' })],
      chaos: [createMockCard({ uuid: 'removed-chaos-1', name: 'Буря хаоса', type: CryptozShared.ECardType.CHAOS })],
    },
    market: overrides.market ?? [
      createMockCard({ uuid: 'market-1', name: 'Зеркало сумерек', price: 4 }),
      createMockCard({ uuid: 'market-2', name: 'Темный артефакт', price: 5 }),
    ],
    stoneShards: overrides.stoneShards ?? [createMockStoneShard({ uuid: 'room-stone-1' })],
    darknessMadness: overrides.darknessMadness ?? [
      createMockCard({ uuid: 'madness-1', name: 'Безумие бездны', type: CryptozShared.ECardType.DARKNESS_MADNESS, price: 7 }),
    ],
    cursedSeal: overrides.cursedSeal ?? [
      createMockCard({ uuid: 'cursed-1', name: 'Печать забвения', type: CryptozShared.ECardType.CURSED_SEAL, isSeal: true }),
    ],
    pendingAckNicknames: overrides.pendingAckNicknames ?? [],
  };
};

export const createMockMessages = () => [
  createMockMessage({ senderNickname: 'Аделина', message: 'Я готова к новому раунду!' }),
  createMockMessage({ senderNickname: 'Виктор', message: 'Сыграй корону, если можешь.' }),
  createMockMessage({ senderNickname: 'Наблюдатель', senderParticipant: 'viewer', message: 'Какой напряженный матч!' }),
];

export const createMockLogs = () => [
  createMockLog({ message: 'Аделина разыграла карту «Зеркало сумерек».' }),
  createMockLog({ message: 'Виктор сбросил карту «Печать забвения».' }),
  createMockLog({ message: 'Участники получили по одному осколку.' }),
];

export interface TSetupOptions {
  room?: Partial<CryptozShared.TRoom>;
  draggedHandCard?: CryptozShared.TCard | null;
  messages?: {
    list?: CryptozShared.TMessage[];
    lastReadIndex?: number;
  };
  logs?: {
    list?: CryptozShared.TLog[];
    lastReadIndex?: number;
  };
}

export const resetRoomPageStores = () => {
  roomStore.clear();
  logsStore.clear();
  messagesStore.clear();
  dialogStore.clearDialogs();
  dialogStore.setCollapsedDialog(null);
  roomStore.setDraggedHandCard(null);
};

export const setupRoomPageState = (options: TSetupOptions = {}) => {
  ensureSocketMocks();
  resetRoomPageStores();

  const room = createMockRoom(options.room);
  roomStore.updateRoom(room);

  const draggedHandCard = options.draggedHandCard ?? null;
  roomStore.setDraggedHandCard(draggedHandCard);

  const messages = options.messages?.list ?? createMockMessages();
  messagesStore.updateMessages(messages);
  if (options.messages?.lastReadIndex !== undefined) {
    const message = messages[options.messages.lastReadIndex];
    if (message) {
      messagesStore.setLastReadMessage(message);
    }
  }

  const logs = options.logs?.list ?? createMockLogs();
  logsStore.updateLogs(logs);
  if (options.logs?.lastReadIndex !== undefined) {
    const log = logs[options.logs.lastReadIndex];
    if (log) {
      logsStore.setLastReadLog(log);
    }
  }

  return {
    room,
    messages,
    logs,
  };
};
