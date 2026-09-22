import type { ReactNode } from 'react';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Volume2, VolumeX } from 'lucide-react';
import { LucidShared } from '@trgames/shared';

import { settingsStore } from '@/stores';
import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { socketService } from '@/routes/games/lucid/PartyPage/services';
import { Ribbon } from '@/routes/games/lucid/PartyPage/components/Ribbon';
import { EventBar } from '@/routes/games/lucid/PartyPage/components/EventCard/EventBar';
import { EventCard } from '@/routes/games/lucid/PartyPage/components/EventCard';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';

import { Die } from './components/Die';

// @trgames/shared отдаёт перечисления только через неймспейс LucidShared,
// плоского реэкспорта не существует — извлекаем сами
const EMoveType = LucidShared.EMoveType;
const EPhase = LucidShared.EPhase;

// Ветки развилки укладываются по возрастанию номера клетки: меньший номер
// уходит вверх от общей линии, больший — вниз (см. layoutTrack). Подпись
// направлением, а не номером: номер клетки человеку ничего не говорит
const BRANCH_LABELS = ['Верхняя тропа', 'Нижняя тропа'];

// Ползунок красится переменными темы: цвета сайта на сгенерированной палитре
// могут совпасть с фоном и пропасть
const SLIDER_CLASS = 'w-20 shrink-0 [&>span:first-child]:bg-[color:var(--lucid-muted)] '
  + '[&>span:first-child>span]:bg-[color:var(--lucid-accent)] '
  + '[&>span:last-child>span]:border-[color:var(--lucid-accent)] '
  + '[&>span:last-child>span]:bg-[color:var(--lucid-base)]';

// Интерфейс лежит поверх поля узкими полосами сверху и снизу: поле занимает
// экран целиком и остаётся героем экрана, полосы молчат
export const Hud = observer(function Hud() {
  // Оптимистичных ходов нет: после нажатия кнопка молчит до прихода нового
  // stateId, а не до применения хода у себя
  const [sentStateId, setSentStateId] = useState<number>();
  // Клетка, событие которой свёрнуто. Именно клетка, а не флаг: следующее
  // событие открывается само, разворачивать его руками не нужно
  const [collapsedCell, setCollapsedCell] = useState<number>();
  // Прежняя громкость, чтобы значок вернул её обратно
  const [mutedVolume, setMutedVolume] = useState<number>();
  const { state, view } = partyStore;

  if (!state || !view) {
    return null;
  }

  const { theme } = state.G;
  const you = state.G.players[state.you];
  const current = state.G.players[state.ctx.currentPlayer];
  const isMyTurn = state.ctx.currentPlayer === state.you;
  const isSent = sentStateId === state.stateId;
  const offline = new Set(view.members.filter(member => !member.isConnected).map(member => member.playerId));
  const { volume } = settingsStore.general;
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

  const handleToggleMute = (): void => {
    if (volume > 0) {
      setMutedVolume(volume);
      settingsStore.setVolume(0);

      return;
    }

    settingsStore.setVolume(mutedVolume ?? 0.35);
  };

  // Невозможное нельзя нажать: не твой ход — кнопок нет вовсе. Тогда отказ
  // сервера перестаёт быть событием для человека
  const renderAction = (): ReactNode => {
    if (state.ctx.phase === EPhase.ENDED) {
      const winner = state.G.winner && state.G.players[state.G.winner];

      return <p className="font-unbounded text-base">{winner ? `Побеждает ${winner.nickname}` : 'Партия окончена'}</p>;
    }

    if (!isMyTurn) {
      return <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{`Ходит ${current.nickname}`}</p>;
    }

    if (state.ctx.phase === EPhase.ROLL) {
      return (
        <Button
          className="w-full whitespace-normal border-2 bg-transparent hover:bg-transparent"
          disabled={isSent}
          onClick={handleRoll}
          style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
          variant="outline"
        >
          Бросить кубик
        </Button>
      );
    }

    // Развилка читается геометрией, и основной способ — нажать на клетку прямо
    // на поле. Кнопки дублируют его: пальцем в клетку попасть труднее, а
    // телефон не получает урезанную игру
    if (state.ctx.phase === EPhase.BRANCH) {
      return (
        <div className="flex flex-col gap-1">
          <p className="text-xs" style={{ color: 'var(--lucid-muted)' }}>Выбери, куда свернуть</p>

          <div className="flex flex-wrap gap-2">
            {[...state.G.branchChoices].sort((first, second) => first - second).map((cellId, index) => (
              <Button
                className="whitespace-normal border-2 bg-transparent hover:bg-transparent"
                disabled={isSent}
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
        <ul className="flex flex-wrap gap-x-3 text-xs" style={{ color: 'var(--lucid-muted)' }}>
          {state.G.order.map(playerId => (
            <li
              className="flex items-center gap-1"
              key={playerId}
              style={playerId === state.ctx.currentPlayer ? { color: 'var(--lucid-text)' } : undefined}
            >
              {playerId === state.ctx.currentPlayer && (
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--lucid-accent)' }}
                />
              )}
              <span>{state.G.players[playerId].nickname}</span>
              {/* Роль — не секрет, но и не главное: всегда приглушена, даже у текущего
                  игрока, хотя кегль (text-xs) тот же — меньше 12px уже неразборчиво.
                  На узком экране режется многоточием, а не ломает строку.
                  max-w вместо фикс. 96px: при 2-3 игроках в строке остаётся
                  свободное место — отдаём его роли; 120px — потолок, выше
                  которого при 6 игроках и длинных ролях строка перестаёт
                  умещаться в те же 3 строки, что и раньше (замерено в Storybook) */}
              {state.G.players[playerId].role && (
                <span
                  className="max-w-[7.5rem] truncate text-xs"
                  style={{ color: 'var(--lucid-muted)' }}
                  title={state.G.players[playerId].role}
                >
                  {`— ${state.G.players[playerId].role}`}
                </span>
              )}
              {offline.has(playerId) && <span>· связь потеряна</span>}
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

        {/* Регулятор стоит у ленты, а не под кнопкой хода: на телефоне строка
            с кубиком и действием и так занята целиком */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 grow"><Ribbon /></div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              aria-label={volume > 0 ? 'Выключить звук' : 'Включить звук'}
              className="size-7 hover:bg-transparent"
              onClick={handleToggleMute}
              size="icon"
              style={{ color: 'var(--lucid-text)' }}
              variant="ghost"
            >
              {volume > 0 ? <Volume2 /> : <VolumeX />}
            </Button>

            <Slider
              aria-label="Громкость"
              className={SLIDER_CLASS}
              max={1}
              min={0}
              onValueChange={([value]) => settingsStore.setVolume(value)}
              step={0.05}
              value={[volume]}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Die roll={state.G.lastRoll} />
          <div className="min-w-0 grow">{renderAction()}</div>
        </div>
      </div>

      {event && !isCollapsed && (
        <EventCard
          currentNickname={current.nickname}
          event={event}
          isMyTurn={isMyTurn}
          isSent={isSent}
          onChoose={handleChooseOption}
          onCollapse={() => setCollapsedCell(event.cellId)}
          resource={you.resource}
        />
      )}
    </>
  );
});
