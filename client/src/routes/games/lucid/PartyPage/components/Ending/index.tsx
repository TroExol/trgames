import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { socketService } from '@/routes/games/lucid/PartyPage/services';
import { Button } from '@/components/ui/Button';

// Поле остаётся видимым вокруг: партия закончилась на нём, и это стоит
// показать. Итогов партии нет — полная история не хранится, считать их не из чего
export const Ending = observer(function Ending() {
  const [isSent, setIsSent] = useState(false);
  const { state, view } = partyStore;

  if (!state || !view) {
    return null;
  }

  const winner = state.G.winner ? state.G.players[state.G.winner] : undefined;
  // Автопилот может победить: ушедший спать игрок способен дойти до финиша
  // первым при живых остальных. Молчать об этом нельзя
  const isWinnerOffline = Boolean(
    winner && view.members.some(member => member.playerId === winner.id && !member.isConnected),
  );

  const handlePlayAgain = (): void => {
    setIsSent(true);
    socketService.playAgain();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
      <div
        className="flex max-w-sm flex-col items-center gap-4 px-6 py-8 text-center backdrop-blur-sm"
        style={{ backgroundColor: 'var(--lucid-veil)' }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-unbounded text-3xl leading-tight">
            {winner ? winner.nickname : 'Партия окончена'}
          </h2>
          {/* Роль — не секрет, но и не главное: мельче и глуше имени победителя,
              как подпись темы строкой ниже */}
          {winner?.role && (
            <p className="truncate text-sm" style={{ color: 'var(--lucid-muted)' }} title={winner.role}>
              {winner.role}
            </p>
          )}
          <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>{state.G.theme.name}</p>
        </div>

        {isWinnerOffline && (
          <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>
            Победитель был не на связи — за него ходил автопилот
          </p>
        )}

        {/* Вечер — это обычно не одна партия, и момент сразу после победы
            решает, случится ли вторая. Рассылать ссылку там, где все уже
            собраны, — лишнее */}
        <Button
          className="w-full whitespace-normal border-2 bg-transparent hover:bg-transparent"
          disabled={isSent}
          onClick={handlePlayAgain}
          style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
          variant="outline"
        >
          Сыграть ещё тем же составом
        </Button>
      </div>
    </div>
  );
});
