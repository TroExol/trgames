import type { ReactNode } from 'react';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { socketService } from '@/routes/games/lucid/PartyPage/services';
import { Ribbon } from '@/routes/games/lucid/PartyPage/components/Ribbon';
import { Button } from '@/components/ui/Button';

import { Die } from './components/Die';

// @trgames/shared отдаёт перечисления только через неймспейс LucidShared,
// плоского реэкспорта не существует — извлекаем сами
const EMoveType = LucidShared.EMoveType;
const EPhase = LucidShared.EPhase;

// Интерфейс лежит поверх поля узкими полосами сверху и снизу: поле занимает
// экран целиком и остаётся героем экрана, полосы молчат
export const Hud = observer(function Hud() {
  // Оптимистичных ходов нет: после нажатия кнопка молчит до прихода нового
  // stateId, а не до применения хода у себя
  const [sentStateId, setSentStateId] = useState<number>();
  const { state, view } = partyStore;

  if (!state || !view) {
    return null;
  }

  const { theme } = state.G;
  const you = state.G.players[state.you];
  const current = state.G.players[state.ctx.currentPlayer];
  const offline = new Set(view.members.filter(member => !member.isConnected).map(member => member.playerId));

  const handleRoll = (): void => {
    setSentStateId(state.stateId);
    // stateId — версия состояния, на которой игрок принимал решение
    socketService.makeMove({ playerId: state.you, stateId: state.stateId, type: EMoveType.ROLL });
  };

  // Невозможное нельзя нажать: не твой ход — кнопок нет вовсе. Тогда отказ
  // сервера перестаёт быть событием для человека
  const renderAction = (): ReactNode => {
    if (state.ctx.phase === EPhase.ENDED) {
      const winner = state.G.winner && state.G.players[state.G.winner];

      return <p className="font-unbounded text-base">{winner ? `Победил ${winner.nickname}` : 'Партия окончена'}</p>;
    }

    if (state.ctx.currentPlayer !== state.you) {
      return <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{`Ходит ${current.nickname}`}</p>;
    }

    if (state.ctx.phase === EPhase.ROLL) {
      return (
        <Button
          className="w-full whitespace-normal border-2 bg-transparent hover:bg-transparent"
          disabled={sentStateId === state.stateId}
          onClick={handleRoll}
          style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
          variant="outline"
        >
          Бросить кубик
        </Button>
      );
    }

    // Ветки выбираются на самом поле: они там уже обведены акцентом, а их
    // номера в полосе человеку ничего не говорят
    if (state.ctx.phase === EPhase.BRANCH) {
      return <p className="text-sm">Выбери на поле, куда свернуть</p>;
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
          <p className="shrink-0 font-unbounded text-base">
            {you.resource}
            <span className="pl-1 font-golos text-xs" style={{ color: 'var(--lucid-muted)' }}>
              {theme.resourceName}
            </span>
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
              {offline.has(playerId) && <span>· связь потеряна</span>}
            </li>
          ))}
        </ul>
      </header>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pb-3 pt-2 backdrop-blur-sm"
        style={{ backgroundColor: 'var(--lucid-veil)' }}
      >
        <Ribbon />

        <div className="flex items-center gap-3">
          <Die roll={state.G.lastRoll} />
          <div className="min-w-0 grow">{renderAction()}</div>
        </div>
      </div>
    </>
  );
});
