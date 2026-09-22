import type { Namespace, Server } from 'socket.io';

import { uid } from 'uid';
import { LucidShared } from '@trgames/shared';

import type { TPartyGroup } from '@/games/lucid/room/PartyGroup';
import type { Party, TPartySnapshot } from '@/games/lucid/room/Party';
import type { TAutopilot } from '@/games/lucid/room/autopilot';

import { t } from '@/i18n';
import { createStorage } from '@/games/lucid/storage/db';
import { createPartyGroup } from '@/games/lucid/room/PartyGroup';
import { createCleanup } from '@/games/lucid/room/cleanup';
import { createAutopilot } from '@/games/lucid/room/autopilot';
import { generateContent } from '@/games/lucid/generation/pipeline';
import { generateJson } from '@/games/lucid/generation/model';
import { chooseAutoMove } from '@/games/lucid/core/autoMove';

// Сколько ждём генерацию, прежде чем сесть за запасную партию. Это потолок,
// а не обычное ожидание: на nitro полный пайплайн укладывается в 49-145 с
// (замеры — docs/lucid/MODELS.md), три минуты — предел, после которого игроки
// садятся за запасную партию. Выбор заказчика: меньше ждать при зависшем
// запросе ценой чуть более частой запасной партии
const GENERATION_BUDGET_MS = 180_000;

// В тестах база живёт в памяти, в бою — файлом рядом с сервером
const STORAGE_PATH = process.env.LUCID_DB_PATH ?? 'lucid.db';

// Комната личного вида — на партию, а не на игрока: один и тот же человек
// держит открытыми две партии подряд, и комната только по playerId общая
// у них обеих. Тогда вид старой партии уезжает во вкладку, где открыта новая,
// и перекрывает её, а сама старая считает игрока подключённым
const playerRoom = (partyUuid: string, playerId: LucidShared.TPlayerId): string =>
  `player:${partyUuid}:${playerId}`;

// Ошибки партии — это коды, а не тексты: перевод живёт в одном месте
const ERROR_MESSAGES: Record<string, string> = {
  'cannot-start': t('lucid.errors.cannotStart', 'ru'),
  'empty-nickname': t('lucid.errors.emptyNickname', 'ru'),
  'empty-theme': t('lucid.errors.emptyTheme', 'ru'),
  'nickname-taken': t('lucid.errors.nicknameTaken', 'ru'),
  'not-a-member': t('lucid.errors.notAMember', 'ru'),
  'party-already-started': t('lucid.errors.partyAlreadyStarted', 'ru'),
  'party-is-full': t('lucid.errors.partyIsFull', 'ru'),
  'theme-too-long': t('lucid.errors.themeTooLong', 'ru'),
};

interface THandlerContext {
  party: Party;
  playerId: LucidShared.TPlayerId;
}

interface TCreateHandlersParams {
  group: TPartyGroup;
  broadcast: (party: Party) => void;
  fail: (party: Party, playerId: LucidShared.TPlayerId, message: string) => void;
  // Новая партия из «сыграть ещё» рождается пустой: срок удаления ей нужен
  // прямо при создании, как и обычному лобби
  sync: (party: Party) => void;
}

export const messageForError = (error: unknown): string => {
  const code = error instanceof Error ? error.message : '';

  return ERROR_MESSAGES[code] ?? t('lucid.errors.unknown', 'ru');
};

interface TCreatePartyContext {
  group: TPartyGroup;
  ownerId: LucidShared.TPlayerId;
  // Созданная партия пуста, пока создатель не вошёл по ссылке: отсрочка до
  // удаления должна пойти прямо отсюда, иначе брошенное лобби осталось бы
  // в базе навсегда
  sync: (party: Party) => void;
}

type TCreatePartyCallback = (
  result: { status: 'ok'; partyId: string } | { status: 'error'; message: string },
) => void;

// Создатель сообщает свой идентификатор сам: рукопожатие партии его назначить
// не может, партии-то ещё нет, а идентификатор у создателя уже есть — выдан
// браузером при первом заходе
export const createParty = (
  { group, ownerId, sync }: TCreatePartyContext,
  callback: TCreatePartyCallback,
): void => {
  try {
    const party = group.create({ uuid: uid(), ownerId });

    sync(party);
    callback({ status: 'ok', partyId: party.uuid });
  } catch (error) {
    callback({ status: 'error', message: messageForError(error) });
  }
};

export const createHandlers = ({ group, broadcast, fail, sync }: TCreateHandlersParams) => {
  // Обёртка вместо повторяющегося try/catch в каждом обработчике.
  // Сохранение здесь, а не в отдельных обработчиках: иначе партия, которая
  // набрала состав и запустила генерацию, но не получила ни одного хода,
  // не переживёт перезапуск сервера — а забыть вызов легко
  const guard = <TArgs extends unknown[]>(
    handler: (context: THandlerContext, ...args: TArgs) => void,
  ) => (context: THandlerContext, ...args: TArgs): void => {
    try {
      handler(context, ...args);
      group.persist(context.party);
      broadcast(context.party);
    } catch (error) {
      fail(context.party, context.playerId, messageForError(error));
    }
  };

  return {
    [LucidShared.ELucidEvent.proposeTheme]: guard(({ party, playerId }, theme: string) => {
      party.proposeTheme(playerId, theme);
    }),

    [LucidShared.ELucidEvent.declineTheme]: guard(({ party, playerId }) => {
      party.declineTheme(playerId);
    }),

    [LucidShared.ELucidEvent.startParty]: guard(({ party, playerId }) => {
      if (playerId !== party.ownerId || !party.canStart) {
        throw new Error('cannot-start');
      }

      void party.start({
        generate: params => generateContent({
          ...params,
          // Мир готов раньше остального, и ожидание устроено как раскрытие:
          // рассылаем его сразу, иначе игроки ждали бы конца генерации,
          // глядя на одну и ту же строку
          onWorld: theme => {
            params.onWorld(theme);
            broadcast(party);
          },
          generateJson,
          deadlineMs: Date.now() + GENERATION_BUDGET_MS,
        }),
      }).then(() => {
        if (party.view(playerId).usedFallback) {
          party.addRibbonLine(t('lucid.ribbon.usedFallback', 'ru'));
        }

        // Генерация асинхронна, и обёртка сохранила партию раньше, чем
        // появилось состояние: сохраняем ещё раз, когда оно готово
        group.persist(party);
        broadcast(party);
      }).catch((error: unknown) => {
        // Без этого catch сбой в generate, в раскладке или в then выше
        // (запись в sqlite, рассылка) улетает необработанным отказом промиса:
        // Node 22 на нём гасит весь процесс, а с ним и соседний Cryptoz
        console.error('lucid: старт партии сорвался', { partyId: party.uuid, playerId, error });

        // Партия уже играется — откатывать нечего, сбой пришёлся на
        // сохранение или рассылку после старта. Повтор их здесь может упасть
        // тем же образом и уйти уже вторым необработанным отказом
        if (party.view(playerId).phase === LucidShared.EPartyPhase.PLAYING) {
          return;
        }

        try {
          party.abortStart();
          party.addRibbonLine(t('lucid.ribbon.startFailed', 'ru'));
          group.persist(party);
          broadcast(party);
        } catch (rollbackError) {
          console.error('lucid: не удалось откатить партию после сбоя старта', {
            partyId: party.uuid,
            playerId,
            error: rollbackError,
          });
        }
      });
    }),

    [LucidShared.ELucidEvent.makeMove]: guard(({ party, playerId }, move: LucidShared.TMove) => {
      // Ход всегда приписывается тому, кто его прислал: доверять полю
      // из сообщения нельзя
      const before = party.rawState()?.stateId;

      party.applyMove({ ...move, playerId });

      // Движок при отказе возвращает то же состояние без причины. Игроку её
      // не показывают — интерфейс не даёт нажать невозможное, — но при разборе
      // жалоб «у меня кнопка не работает» она нужна
      if (party.rawState()?.stateId === before) {
        console.warn('lucid: ход отклонён', { partyId: party.uuid, playerId, move });
      }
    }),

    [LucidShared.ELucidEvent.playAgain]: guard(({ party, playerId }) => {
      const next = group.create({ uuid: uid(), ownerId: playerId });

      party.view(playerId).members.forEach(member => {
        next.join({ playerId: member.playerId, nickname: member.nickname });
        // Место занято, но человек ещё не подключился. Без этого новая партия
        // выглядит полной подключённых, не получает срока удаления и остаётся
        // в базе навсегда, если по ссылке никто так и не придёт
        next.disconnect(member.playerId);
      });

      // Номер новой партии уезжает видом, а не строкой ленты: лента написана
      // для человека, и выдирать из неё номер регулярным выражением клиент
      // не должен
      party.setNextParty(next.uuid);
      group.persist(next);
      sync(next);
      party.addRibbonLine(t('lucid.ribbon.playAgain', 'ru'));
    }),
  };
};

export const init = (io: Server): void => {
  const group = createPartyGroup({ storage: createStorage<TPartySnapshot>(STORAGE_PATH) });

  // Один автопилот на партию, а не на подключение: иначе таймер, заведённый
  // прежним соединением, остался бы в объекте, до которого новое не дотянется
  const autopilots = new Map<string, TAutopilot>();
  // Партия живёт один вечер: опустела и выждала отсрочку — удаляется и из
  // памяти, и из базы
  const cleanup = createCleanup({
    remove: uuid => {
      // Автопилот держит ссылку на партию и сам её сохраняет: не остановив
      // его, мы вернули бы удалённую партию в базу следующим же ходом
      autopilots.get(uuid)?.stop();
      autopilots.delete(uuid);
      group.remove(uuid);
    },
  });

  // Общий неймспейс игры: единственное, что он умеет, — создать партию.
  // Через неймспейс партии это невозможно, потому что рукопожатие там
  // требует уже существующий идентификатор
  const lobby = io.of('/lucid/lobby') as Namespace<
    LucidShared.TLucidLobbyClientToServerEvents,
    LucidShared.TLucidLobbyServerToClientEvents
  >;

  lobby.on('connection', socket => {
    const ownerId = socket.handshake.query.playerId;

    socket.on(LucidShared.ELucidEvent.createParty, callback => {
      if (typeof ownerId !== 'string') {
        callback({ status: 'error', message: t('lucid.errors.unknown', 'ru') });

        return;
      }

      createParty({ group, ownerId, sync: cleanup.sync }, callback);
    });

    socket.on('error', error => console.error(error));
  });

  const namespace = io.of('/lucid') as Namespace<
    LucidShared.TLucidClientToServerEvents,
    LucidShared.TLucidServerToClientEvents
  >;

  const fail = (party: Party, playerId: LucidShared.TPlayerId, message: string): void => {
    namespace.to(playerRoom(party.uuid, playerId)).emit(LucidShared.ELucidEvent.showError, { message });
  };

  // autopilotFor и syncAutopilot ссылаются на broadcast раньше её объявления:
  // это разрешено, потому что обе используют её изнутри колбэков, которые
  // выполнятся уже после того, как broadcast будет присвоена ниже
  const autopilotFor = (party: Party): TAutopilot => {
    const existing = autopilots.get(party.uuid);

    if (existing) {
      return existing;
    }

    const created = createAutopilot({
      play: absentId => {
        const state = party.rawState();

        if (!state) {
          return;
        }

        const move = chooseAutoMove(state);

        if (!move) {
          return;
        }

        const before = state.stateId;

        party.applyMove({ ...move, playerId: absentId });

        // Строка в ленту только если ход действительно применился: иначе
        // игроки прочитали бы про ход, которого не было
        if (party.rawState()?.stateId !== before) {
          party.addRibbonLine(t('lucid.ribbon.autopilotMoved', 'ru', {
            nickname: party.nicknameOf(absentId),
          }));
        }

        group.persist(party);
        broadcast(party);
      },
    });

    autopilots.set(party.uuid, created);

    return created;
  };

  // Автопилот нужен ровно тогда, когда ходить должен тот, кого нет на связи.
  // Проверка после каждой рассылки заодно перевзводит таймер сама: сходил
  // автопилот — состояние изменилось — проверили снова
  const syncAutopilot = (party: Party): void => {
    const autopilot = autopilotFor(party);
    const state = party.rawState();

    autopilot.stop();

    if (!state || state.ctx.phase === LucidShared.EPhase.ENDED) {
      autopilots.delete(party.uuid);

      return;
    }

    if (!party.isConnected(state.ctx.currentPlayer)) {
      autopilot.schedule(state.ctx.currentPlayer);
    }
  };

  // Каждому свой вид: непройденные клетки не должны уехать игроку
  const broadcast = (party: Party): void => {
    party.view(party.ownerId).members.forEach(member => {
      namespace
        .to(playerRoom(party.uuid, member.playerId))
        .emit(LucidShared.ELucidEvent.updateParty, party.view(member.playerId));
    });

    const delta = party.takeRibbonDelta();

    if (delta.length > 0) {
      namespace.to(party.uuid).emit(LucidShared.ELucidEvent.appendRibbon, delta);
    }

    syncAutopilot(party);
    cleanup.sync(party);
  };

  const handlers = createHandlers({
    group,
    broadcast: party => broadcast(party),
    fail,
    sync: cleanup.sync,
  });

  namespace.use((socket, next) => {
    const { partyId, playerId, nickname } = socket.handshake.query;

    if (typeof partyId !== 'string' || typeof playerId !== 'string'
      || typeof nickname !== 'string') {
      next(new Error(t('lucid.errors.partyNotFound', 'ru')));

      return;
    }

    const party = group.get(partyId);

    if (!party) {
      next(new Error(t('lucid.errors.partyNotFound', 'ru')));

      return;
    }

    try {
      party.join({ playerId, nickname });
      next();
    } catch (error) {
      next(new Error(messageForError(error)));
    }
  });

  namespace.on('connection', socket => {
    const partyId = socket.handshake.query.partyId as string;
    const playerId = socket.handshake.query.playerId as string;
    const party = group.get(partyId)!;
    const context = { party, playerId };

    // Две комнаты: одна на партию для общих сообщений, одна на игрока —
    // чтобы личный вид уехал только ему
    void socket.join(party.uuid);
    void socket.join(playerRoom(party.uuid, playerId));

    group.persist(party);
    broadcast(party);

    socket.on(LucidShared.ELucidEvent.proposeTheme, theme => {
      handlers[LucidShared.ELucidEvent.proposeTheme](context, theme);
    });
    socket.on(LucidShared.ELucidEvent.declineTheme, () => {
      handlers[LucidShared.ELucidEvent.declineTheme](context);
    });
    socket.on(LucidShared.ELucidEvent.startParty, () => {
      handlers[LucidShared.ELucidEvent.startParty](context);
    });
    socket.on(LucidShared.ELucidEvent.makeMove, move => {
      handlers[LucidShared.ELucidEvent.makeMove](context, move);
    });
    socket.on(LucidShared.ELucidEvent.playAgain, () => {
      handlers[LucidShared.ELucidEvent.playAgain](context);
    });

    socket.on('disconnect', () => {
      // Игрок мог вернуться новым соединением раньше, чем сервер заметил
      // потерю старого: обрыв транспорта и перезагрузка страницы дают именно
      // такой порядок. Гасить связь тогда нельзя — за живым человеком начал бы
      // ходить автопилот. К этому событию сокет уже покинул свои комнаты,
      // поэтому в комнате игрока остались только живые соединения — и только
      // этой партии: соединение к соседней за живое тут не считается
      if (!namespace.adapter.rooms.get(playerRoom(party.uuid, playerId))?.size) {
        party.disconnect(playerId);
      }

      // Заводить таймер здесь не нужно: рассылка сама решит, нужен ли он
      broadcast(party);
    });

    socket.on('error', error => console.error(error));
  });
};
