import type { ReactNode } from 'react';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { socketService } from '@/routes/games/lucid/PartyPage/services';
import { Ribbon } from '@/routes/games/lucid/PartyPage/components/Ribbon';
import { PlayerView } from '@/routes/games/lucid/PartyPage/components/PlayerView';
import { LawsStrip } from '@/routes/games/lucid/PartyPage/components/LawsStrip';
import { Hand } from '@/routes/games/lucid/PartyPage/components/Hand';
import { EventBar } from '@/routes/games/lucid/PartyPage/components/EventCard/EventBar';
import { EventCard } from '@/routes/games/lucid/PartyPage/components/EventCard';
import { CardPick } from '@/routes/games/lucid/PartyPage/components/CardPick';
import { pluralizeSteps } from '@/lib/lucid/pluralize';
import { ZONE_LABEL } from '@/lib/lucid/cellLook';
import { Button } from '@/components/ui/Button';

import { TruncatedText } from './components/TruncatedText';
import { Die } from './components/Die';

// @trgames/shared отдаёт перечисления только через неймспейс LucidShared,
// плоского реэкспорта не существует — извлекаем сами
const EMoveType = LucidShared.EMoveType;
const EPhase = LucidShared.EPhase;

// Ветки развилки укладываются по возрастанию номера клетки: меньший номер
// уходит вверх от общей линии, больший — вниз (см. layoutTrack). Подпись
// направлением, а не номером: номер клетки человеку ничего не говорит
const BRANCH_LABELS = ['Верхняя тропа', 'Нижняя тропа'];

interface THudProps {
  children: ReactNode;
}

// Шапка, поле и нижняя панель идут столбиком: поле получает ровно остаток
// высоты, ничто его не перекрывает, кроме полноэкранных модалок
export const Hud = observer(function Hud({ children }: THudProps) {
  // Оптимистичных ходов нет: после нажатия кнопка молчит до прихода нового
  // stateId, а не до применения хода у себя
  const [sentStateId, setSentStateId] = useState<number>();
  const [pendingBuy, setPendingBuy] = useState<{ index: number; stateId: number }>();
  // Клетка, событие которой свёрнуто. Именно клетка, а не флаг: следующее
  // событие открывается само, разворачивать его руками не нужно
  const [collapsedCell, setCollapsedCell] = useState<number>();
  const [collapsedPick, setCollapsedPick] = useState<string>();
  const [viewedPlayerId, setViewedPlayerId] = useState<LucidShared.TPlayerId>();
  const { state, view } = partyStore;

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
  // Событие берётся по клетке ходящего игрока: его читают все, а не только тот,
  // чей ход
  const event = state.ctx.phase === EPhase.CHOICE
    ? state.G.turn.lawEvent ?? state.G.events[state.G.turn.eventCellId ?? current.position]
    : undefined;
  const isCollapsed = event !== undefined && collapsedCell === event.cellId;
  const isDiscarding = pendingBuy !== undefined && pendingBuy.stateId === state.stateId;
  const pickTitle = !isMyTurn
    ? undefined
    : state.ctx.phase === EPhase.LAW
      ? 'Выбор закона'
      : state.ctx.phase === EPhase.SHOP
        ? isDiscarding ? 'Сброс карты' : 'Лавка'
        : undefined;
  const pickKey = `${state.stateId}:${isDiscarding ? 'discard' : state.ctx.phase}`;
  const isPickCollapsed = collapsedPick === pickKey;
  const handlePickCollapse = (): void => setCollapsedPick(pickKey);

  const handleRoll = (): void => {
    setSentStateId(state.stateId);
    // stateId — версия состояния, на которой игрок принимал решение
    socketService.makeMove({ playerId: state.you, stateId: state.stateId, type: EMoveType.ROLL });
  };

  const handleOpenSafe = (bonus: number): void => {
    setSentStateId(state.stateId);
    socketService.makeMove({
      bonus,
      playerId: state.you,
      stateId: state.stateId,
      type: EMoveType.OPEN_SAFE,
    });
  };

  const handleChooseDie = (dieIndex: number): void => {
    setSentStateId(state.stateId);
    socketService.makeMove({
      dieIndex,
      playerId: state.you,
      stateId: state.stateId,
      type: EMoveType.CHOOSE_DIE,
    });
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

  const handleChooseLaw = (index: number): void => {
    setSentStateId(state.stateId);
    socketService.makeMove({
      index,
      playerId: state.you,
      stateId: state.stateId,
      type: EMoveType.CHOOSE_LAW,
    });
  };

  const handleBuy = (index: number | null, discardUid?: number): void => {
    setSentStateId(state.stateId);
    setPendingBuy(undefined);
    socketService.makeMove({
      discardUid,
      index,
      playerId: state.you,
      stateId: state.stateId,
      type: EMoveType.BUY_CARD,
    });
  };

  const handlePlayCard = (uid: number, targetId?: string): void => {
    setSentStateId(state.stateId);
    socketService.makeMove({
      playerId: state.you,
      stateId: state.stateId,
      targetId,
      type: EMoveType.PLAY_CARD,
      uid,
    });
  };

  const handleEndTurn = (): void => {
    setSentStateId(state.stateId);
    socketService.makeMove({ playerId: state.you, stateId: state.stateId, type: EMoveType.END_TURN });
  };

  // Невозможное нельзя нажать: не твой ход — кнопок нет вовсе. Тогда отказ
  // сервера перестаёт быть событием для человека
  const renderAction = (): ReactNode => {
    if (state.ctx.phase === EPhase.ENDED) {
      const winner = state.G.winner && state.G.players[state.G.winner];

      return <p className="font-unbounded text-base">{winner ? `Побеждает ${winner.nickname}` : 'Партия окончена'}</p>;
    }

    if (state.ctx.phase === EPhase.LAW) {
      return <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{`${current.nickname} выбирает закон`}</p>;
    }

    if (state.ctx.phase === EPhase.SHOP) {
      return <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{`${current.nickname} в Лавке`}</p>;
    }

    if (state.ctx.phase === EPhase.CARDS) {
      if (!isMyTurn) {
        return <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{`Ходит ${current.nickname}`}</p>;
      }

      return (
        <Button
          className="w-full whitespace-normal border-2 bg-transparent hover:bg-transparent"
          disabled={isSent || isRevealing}
          onClick={handleEndTurn}
          style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
          variant="outline"
        >
          Закончить ход
        </Button>
      );
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

    if (state.ctx.phase === EPhase.DICE) {
      const values = state.G.lastRoll?.values ?? [];

      if (!isMyTurn) {
        return <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{`${current.nickname} выбирает кубик`}</p>;
      }

      return (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <Button
              className="whitespace-normal border-2 bg-transparent hover:bg-transparent"
              disabled={isSent || isRevealing}
              key={index}
              onClick={() => handleChooseDie(index)}
              size="sm"
              style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
              variant="outline"
            >
              {`Идти на ${value}`}
            </Button>
          ))}
        </div>
      );
    }

    const isAtSafe = state.ctx.phase === EPhase.ROLL && current.position === state.G.track.finishId;

    if (!isMyTurn) {
      const text = isAtSafe ? `${current.nickname} открывает сейф` : `Ходит ${current.nickname}`;

      return <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{text}</p>;
    }

    if (isAtSafe) {
      return (
        <div className="flex flex-col gap-2">
          {LucidShared.SAFE_BONUS_COSTS.map((cost, bonus) => (
            <Button
              className="w-full whitespace-normal border-2 bg-transparent hover:bg-transparent"
              disabled={isSent || isRevealing || you.resource < cost}
              key={bonus}
              onClick={() => handleOpenSafe(bonus)}
              size="sm"
              style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
              variant="outline"
            >
              {`${bonus === 0 ? 'Открыть сейф' : `+${bonus} за ${cost}`} · нужно ${LucidShared.safeNeed(bonus)}+`}
            </Button>
          ))}
        </div>
      );
    }

    if (state.ctx.phase === EPhase.ROLL) {
      const depths = LucidShared.trackDepths(state.G.track);
      const zone = LucidShared.diceZoneForDepth(depths[current.position] ?? 0, depths[state.G.track.finishId] ?? 0);

      return (
        <Button
          className="w-full whitespace-normal border-2 bg-transparent hover:bg-transparent"
          disabled={isSent || isRevealing}
          onClick={handleRoll}
          style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
          variant="outline"
        >
          {zone === LucidShared.EDiceZone.ONE ? 'Бросить кубик' : `Бросить: ${ZONE_LABEL[zone]}`}
        </Button>
      );
    }

    return <p className="text-sm">Событие ждёт решения</p>;
  };

  const renderShop = (): ReactNode => {
    const hand = state.G.cards.hands[state.you] ?? [];
    const { resourceName } = theme;

    if (isDiscarding) {
      return (
        <CardPick
          isSent={isSent || isRevealing}
          items={hand.map(item => ({
            actionLabel: 'Сбросить',
            key: String(item.uid),
            name: LucidShared.cardName(state.G, item.card),
            rule: LucidShared.SHOP_TEXT[item.card].rule(resourceName),
          }))}
          onCollapse={handlePickCollapse}
          onPick={index => handleBuy(pendingBuy.index, hand[index].uid)}
          onSkip={() => setPendingBuy(undefined)}
          skipLabel="Назад"
          title="Рука полна: что сбросить?"
        />
      );
    }

    return (
      <CardPick
        isSent={isSent || isRevealing}
        items={state.G.cards.shopOffer.map(item => ({
          actionLabel: 'Купить',
          disabled: you.resource < LucidShared.SHOP_PRICE,
          flavor: state.G.cardNames?.[item.card]?.flavor,
          key: String(item.uid),
          name: LucidShared.cardName(state.G, item.card),
          rule: LucidShared.SHOP_TEXT[item.card].rule(resourceName),
        }))}
        onCollapse={handlePickCollapse}
        onPick={index => {
          if (hand.length >= LucidShared.HAND_LIMIT) {
            setPendingBuy({ index, stateId: state.stateId });
          } else {
            handleBuy(index);
          }
        }}
        onSkip={() => handleBuy(null)}
        skipLabel="Ничего не беру"
        title={`Лавка: одна карта за ${LucidShared.SHOP_PRICE}`}
      />
    );
  };

  return (
    <>
      <header
        className="flex flex-none flex-col gap-1 border-b px-3 py-2"
        style={{ backgroundColor: 'var(--lucid-veil)', borderColor: 'var(--lucid-muted)' }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="min-w-0 font-unbounded text-base">
            <TruncatedText className="block max-w-full truncate" text={theme.name} />
          </h1>
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

        {/* Строка игрока — одна кнопка: тап открывает PlayerView. Ресурс и число
            карт не сжимаются, ник обрезается. */}
        <ul
          className="flex flex-wrap gap-x-3 text-xs"
          style={{ color: 'var(--lucid-muted)' }}
        >
          {state.G.order.map(playerId => {
            const player = state.G.players[playerId];
            const handSize = (state.G.cards.hands[playerId] ?? []).length;

            return (
              <li className="min-w-0" key={playerId}>
                <button
                  className="flex w-full min-w-0 items-center gap-1 text-left"
                  onClick={() => setViewedPlayerId(playerId)}
                  style={playerId === state.ctx.currentPlayer ? { color: 'var(--lucid-text)' } : undefined}
                  type="button"
                >
                  {playerId === state.ctx.currentPlayer && (
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: 'var(--lucid-accent)' }}
                    />
                  )}
                  <span className="min-w-0 shrink truncate">{player.nickname}</span>
                  <span className="shrink-0">{`· ${player.resource}`}</span>
                  {handSize > 0 && <span className="shrink-0">{`· карт ${handSize}`}</span>}
                  {offline.has(playerId) && <span className="shrink-0">· связь потеряна</span>}
                </button>
              </li>
            );
          })}
        </ul>

        <LawsStrip />
      </header>

      <div className="flex min-h-0 grow px-2">{children}</div>

      <div
        className="flex flex-none flex-col gap-2 border-t px-3 pb-3 pt-2"
        style={{ backgroundColor: 'var(--lucid-veil)', borderColor: 'var(--lucid-muted)' }}
      >
        {event && isCollapsed && (
          <EventBar
            currentNickname={current.nickname}
            isMyTurn={isMyTurn}
            onExpand={() => setCollapsedCell(undefined)}
            title={event.title}
          />
        )}

        {pickTitle && isPickCollapsed && (
          <EventBar
            currentNickname={current.nickname}
            isMyTurn
            onExpand={() => setCollapsedPick(undefined)}
            title={pickTitle}
          />
        )}

        <Ribbon />

        <Hand
          canPlay={isMyTurn && state.ctx.phase === EPhase.CARDS}
          isSent={isSent || isRevealing}
          onPlay={handlePlayCard}
        />

        <div className="flex items-center gap-3">
          <Die
            roll={partyStore.dicePhase === 'idle' ? state.G.lastRoll : partyStore.pendingRoll}
            spinning={partyStore.dicePhase === 'spinning'}
          />
          <div className="min-w-0 grow">{renderAction()}</div>
        </div>
      </div>

      {state.ctx.phase === EPhase.LAW && isMyTurn && !isPickCollapsed && (
        <CardPick
          isSent={isSent || isRevealing}
          items={state.G.cards.lawDraw.map(law => ({
            actionLabel: 'Ввести',
            key: law,
            name: LucidShared.cardName(state.G, law),
            rule: LucidShared.LAW_TEXT[law].rule(theme.resourceName),
          }))}
          onCollapse={handlePickCollapse}
          onPick={handleChooseLaw}
          title="Закон: какой ввести?"
        />
      )}

      {state.ctx.phase === EPhase.SHOP && isMyTurn && !isPickCollapsed && renderShop()}

      {event && !isCollapsed && (
        <EventCard
          currentNickname={current.nickname}
          event={event}
          isMyTurn={isMyTurn}
          isSent={isSent || isRevealing}
          onChoose={handleChooseOption}
          onCollapse={() => setCollapsedCell(event.cellId)}
          resource={current.resource}
          resourceName={theme.resourceName}
        />
      )}

      {viewedPlayerId && <PlayerView onClose={() => setViewedPlayerId(undefined)} playerId={viewedPlayerId} />}
    </>
  );
});
