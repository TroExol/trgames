import type { ReactNode } from 'react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { socketService } from '@/routes/games/lucid/PartyPage/services';
import { Ribbon } from '@/routes/games/lucid/PartyPage/components/Ribbon';
import { EventBar } from '@/routes/games/lucid/PartyPage/components/EventCard/EventBar';
import { EventCard } from '@/routes/games/lucid/PartyPage/components/EventCard';
import { pluralizeSteps } from '@/lib/lucid/pluralize';
import { Button } from '@/components/ui/Button';

import { Outcome } from './Outcome';
import { Die } from './components/Die';

// @trgames/shared отдаёт перечисления только через неймспейс LucidShared,
// плоского реэкспорта не существует — извлекаем сами
const EMoveType = LucidShared.EMoveType;
const EPhase = LucidShared.EPhase;

// Ветки развилки укладываются по возрастанию номера клетки: меньший номер
// уходит вверх от общей линии, больший — вниз (см. layoutTrack). Подпись
// направлением, а не номером: номер клетки человеку ничего не говорит
const BRANCH_LABELS = ['Верхняя тропа', 'Нижняя тропа'];

// Интерфейс лежит поверх поля узкими полосами сверху и снизу: поле занимает
// экран целиком и остаётся героем экрана, полосы молчат
export const Hud = observer(function Hud() {
  // Оптимистичных ходов нет: после нажатия кнопка молчит до прихода нового
  // stateId, а не до применения хода у себя
  const [sentStateId, setSentStateId] = useState<number>();
  // Клетка, событие которой свёрнуто. Именно клетка, а не флаг: следующее
  // событие открывается само, разворачивать его руками не нужно
  const [collapsedCell, setCollapsedCell] = useState<number>();
  // Итог только что разыгранного варианта — своя клетка и запись истории,
  // не флаг: пока он висит, следующее событие всё равно открывается само
  const [outcome, setOutcome] = useState<{ cellId: number; entry: LucidShared.THistoryEntry }>();
  // Клетка события с прошлого рендера: пропадает или меняется — значит по
  // ней только что разыграли вариант. Ref, а не state: хук должен звать
  // хуки безусловно, а state ниже вычисляется уже после возможного раннего return
  const prevEventCellRef = useRef<number>();
  const { state, view } = partyStore;
  const currentEventCellId = state && state.ctx.phase === LucidShared.EPhase.CHOICE
    ? state.G.events[state.G.players[state.ctx.currentPlayer].position]?.cellId
    : undefined;

  useEffect(() => {
    const prevCellId = prevEventCellRef.current;

    prevEventCellRef.current = currentEventCellId;

    if (!state || prevCellId === undefined || prevCellId === currentEventCellId) {
      return;
    }

    const entry = state.G.cellHistory[prevCellId]?.at(-1);

    if (entry) {
      setOutcome({ cellId: prevCellId, entry });
    }
    // Реагируем только на смену состояния партии — currentEventCellId и cellHistory
    // берутся из его же снимка, отдельно отслеживать их незачем
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.stateId]);

  if (!state || !view) {
    return null;
  }

  const { theme } = state.G;
  const you = state.G.players[state.you];
  const current = state.G.players[state.ctx.currentPlayer];
  const isMyTurn = state.ctx.currentPlayer === state.you;
  const isSent = sentStateId === state.stateId;
  // Пока кубик катится/показывает значение или фишка идёт по клеткам, view
  // ещё не применён — нажатие ушло бы по устаревшему виду
  const isRevealing = partyStore.isRevealing;
  const offline = new Set(view.members.filter(member => !member.isConnected).map(member => member.playerId));
  // Без единой роли (запасная партия, 4.7) колонки грида ниже ни на что не
  // тратятся — нечего обрезать. Тогда строке выгоднее обычный flex-wrap:
  // он пакует короткие ники по факту их ширины, а не по минимуму колонки
  const hasAnyRole = state.G.order.some(playerId => Boolean(state.G.players[playerId].role));
  // Событие берётся по клетке ходящего игрока: его читают все, а не только тот,
  // чей ход
  const event = state.ctx.phase === EPhase.CHOICE ? state.G.events[current.position] : undefined;
  const isCollapsed = event !== undefined && collapsedCell === event.cellId;

  const handleRoll = (): void => {
    setSentStateId(state.stateId);
    // stateId — версия состояния, на которой игрок принимал решение
    socketService.makeMove({ playerId: state.you, stateId: state.stateId, type: EMoveType.ROLL });
  };

  const handleChooseBranch = (cellId: number): void => {
    setSentStateId(state.stateId);
    socketService.makeMove({
      cellId,
      playerId: state.you,
      stateId: state.stateId,
      type: EMoveType.CHOOSE_BRANCH,
    });
  };

  const handleChooseOption = (optionIndex: number): void => {
    setSentStateId(state.stateId);
    socketService.makeMove({
      optionIndex,
      playerId: state.you,
      stateId: state.stateId,
      type: EMoveType.CHOOSE_OPTION,
    });
  };

  // Невозможное нельзя нажать: не твой ход — кнопок нет вовсе. Тогда отказ
  // сервера перестаёт быть событием для человека
  const renderAction = (): ReactNode => {
    if (state.ctx.phase === EPhase.ENDED) {
      const winner = state.G.winner && state.G.players[state.G.winner];

      return <p className="font-unbounded text-base">{winner ? `Побеждает ${winner.nickname}` : 'Партия окончена'}</p>;
    }

    // Остаток шагов у развилки виден всем, не только ходящему: ждущие видят,
    // сколько ещё до следующей клетки события (задача 2)
    if (state.ctx.phase === EPhase.BRANCH) {
      const stepsLine = `Осталось ${pluralizeSteps(state.G.pendingSteps)}`;

      if (!isMyTurn) {
        return (
          <div className="flex flex-col gap-0.5">
            <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{`Ходит ${current.nickname}`}</p>
            <p className="text-xs" style={{ color: 'var(--lucid-muted)' }}>{stepsLine}</p>
          </div>
        );
      }

      // Развилка читается геометрией, и основной способ — нажать на клетку прямо
      // на поле. Кнопки дублируют его: пальцем в клетку попасть труднее, а
      // телефон не получает урезанную игру
      return (
        <div className="flex flex-col gap-1">
          <p className="text-xs" style={{ color: 'var(--lucid-muted)' }}>{`Выбери, куда свернуть · ${stepsLine.toLowerCase()}`}</p>

          <div className="flex flex-wrap gap-2">
            {[...state.G.branchChoices].sort((first, second) => first - second).map((cellId, index) => (
              <Button
                className="whitespace-normal border-2 bg-transparent hover:bg-transparent"
                disabled={isSent || isRevealing}
                key={cellId}
                onClick={() => handleChooseBranch(cellId)}
                size="sm"
                style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
                variant="outline"
              >
                {BRANCH_LABELS[index] ?? `Тропа ${index + 1}`}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (!isMyTurn) {
      return <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{`Ходит ${current.nickname}`}</p>;
    }

    if (state.ctx.phase === EPhase.ROLL) {
      return (
        <Button
          className="w-full whitespace-normal border-2 bg-transparent hover:bg-transparent"
          disabled={isSent || isRevealing}
          onClick={handleRoll}
          style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
          variant="outline"
        >
          Бросить кубик
        </Button>
      );
    }

    return <p className="text-sm">Событие ждёт решения</p>;
  };

  return (
    <>
      <header
        className="absolute inset-x-0 top-0 flex flex-col gap-1 px-3 py-2 backdrop-blur-sm"
        style={{ backgroundColor: 'var(--lucid-veil)' }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="truncate font-unbounded text-base">{theme.name}</h1>
          {/* Название ресурса придумывает нейросеть, и склонять его по числу
              нечем: рода и типа склонения у строки нет. Название стоит перед
              числом подписью — подпись со значением не согласуются */}
          <p className="shrink-0 font-unbounded text-base">
            <span className="pr-1 font-golos text-xs" style={{ color: 'var(--lucid-muted)' }}>
              {theme.resourceName}
            </span>
            {you.resource}
          </p>
        </div>

        {/* Пока за отвалившегося ходит автопилот, это видно всем: иначе
            остальные обсуждают решения, которых человек не принимал */}
        {/* grid вместо flex-wrap: ширина колонки не зависит от длины роли, а
            auto-fit схлопывает пустые колонки — при 2 игроках им достаётся вся
            строка, при 6 на 360-390px колонок ровно две (см. комментарий у
            роли), как и раньше */}
        <ul
          className={
            hasAnyRole
              ? 'grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-x-3 text-xs'
              : 'flex flex-wrap gap-x-3 text-xs'
          }
          style={{ color: 'var(--lucid-muted)' }}
        >
          {state.G.order.map(playerId => (
            <li
              className="flex min-w-0 items-center gap-1"
              key={playerId}
              style={playerId === state.ctx.currentPlayer ? { color: 'var(--lucid-text)' } : undefined}
            >
              {playerId === state.ctx.currentPlayer && (
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--lucid-accent)' }}
                />
              )}
              <span className="shrink-0">{state.G.players[playerId].nickname}</span>
              {/* Роль — не секрет, но и не главное: всегда приглушена, даже у текущего
                  игрока, хотя кегль (text-xs) тот же — меньше 12px уже неразборчиво.
                  Без max-w: ширину задаёт колонка грида, а не сама роль, поэтому
                  свободное место в строке достаётся роли честно, а не по фикс.
                  потолку. minmax(9rem,...) — 9rem подобран под 360/390px: при
                  шести игроках колонок ровно две (floor(336/(144+12))=2), строка
                  остаётся в 3 ряда, как и раньше (замерено в Storybook) */}
              {state.G.players[playerId].role && (
                <span
                  className="min-w-0 truncate text-xs"
                  style={{ color: 'var(--lucid-muted)' }}
                  title={state.G.players[playerId].role}
                >
                  {`— ${state.G.players[playerId].role}`}
                </span>
              )}
              {offline.has(playerId) && <span className="shrink-0">· связь потеряна</span>}
            </li>
          ))}
        </ul>
      </header>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pb-3 pt-2 backdrop-blur-sm"
        style={{ backgroundColor: 'var(--lucid-veil)' }}
      >
        {event && isCollapsed && (
          <EventBar
            currentNickname={current.nickname}
            isMyTurn={isMyTurn}
            onExpand={() => setCollapsedCell(undefined)}
            title={event.title}
          />
        )}

        {outcome && (
          <Outcome lines={outcome.entry.lines} onClose={() => setOutcome(undefined)} />
        )}

        <Ribbon />

        <div className="flex items-center gap-3">
          <Die
            roll={partyStore.dicePhase === 'idle' ? state.G.lastRoll : partyStore.pendingRoll}
            spinning={partyStore.dicePhase === 'spinning'}
          />
          <div className="min-w-0 grow">{renderAction()}</div>
        </div>
      </div>

      {event && !isCollapsed && (
        <EventCard
          currentNickname={current.nickname}
          event={event}
          isMyTurn={isMyTurn}
          isSent={isSent || isRevealing}
          onChoose={handleChooseOption}
          onCollapse={() => setCollapsedCell(event.cellId)}
          resource={you.resource}
          resourceName={theme.resourceName}
        />
      )}
    </>
  );
});
