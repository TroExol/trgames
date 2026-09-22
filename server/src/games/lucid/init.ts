import type { Namespace, Server } from 'socket.io';

import { uid } from 'uid';
import { LucidShared } from '@trgames/shared';

import type { TPartyGroup } from '@/games/lucid/room/PartyGroup';
import type { Party } from '@/games/lucid/room/Party';

import { t } from '@/i18n';
import { generateContent } from '@/games/lucid/generation/pipeline';
import { generateJson } from '@/games/lucid/generation/model';

// Сколько ждём генерацию, прежде чем сесть за запасную партию
const GENERATION_BUDGET_MS = 90_000;

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
  const namespace = io.of('/lucid') as Namespace<
    LucidShared.TLucidClientToServerEvents,
    LucidShared.TLucidServerToClientEvents
  >;

  namespace.on('connection', socket => {
    socket.on('error', error => console.error(error));
  });
};
