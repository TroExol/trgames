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

// Сколько ждём генерацию, прежде чем сесть за запасную партию
const GENERATION_BUDGET_MS = 90_000;

// В тестах база живёт в памяти, в бою — файлом рядом с сервером
const STORAGE_PATH = process.env.LUCID_DB_PATH ?? 'lucid.db';

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
  fail: (playerId: LucidShared.TPlayerId, message: string) => void;
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

export const createHandlers = ({ group, broadcast, fail }: TCreateHandlersParams) => {
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
      fail(context.playerId, messageForError(error));
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
      });

      party.addRibbonLine(`Новая партия: ${next.uuid}`);
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

  const fail = (playerId: LucidShared.TPlayerId, message: string): void => {
    namespace.to(`player:${playerId}`).emit(LucidShared.ELucidEvent.showError, { message });
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
        .to(`player:${member.playerId}`)
        .emit(LucidShared.ELucidEvent.updateParty, party.view(member.playerId));
    });

    const delta = party.takeRibbonDelta();

    if (delta.length > 0) {
      namespace.to(party.uuid).emit(LucidShared.ELucidEvent.appendRibbon, delta);
    }

    syncAutopilot(party);
    cleanup.sync(party);
  };

  const handlers = createHandlers({ group, broadcast: party => broadcast(party), fail });

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
    void socket.join(`player:${playerId}`);

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
      party.disconnect(playerId);
      // Заводить таймер здесь не нужно: рассылка сама решит, нужен ли он
      broadcast(party);
    });

    socket.on('error', error => console.error(error));
  });
};
