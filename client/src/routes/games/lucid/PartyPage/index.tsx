import type { FormEvent } from 'react';

import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { socketService } from '@/routes/games/lucid/PartyPage/services';
import { Lobby } from '@/routes/games/lucid/PartyPage/components/Lobby';
import { usePlayerId } from '@/hooks/usePlayerId';
import { useNickname } from '@/hooks/useNickname';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const Component = observer(function LucidPartyPage() {
  const { partyId } = useParams();
  const playerId = usePlayerId();
  const [nickname, setNickname] = useNickname();
  const [nicknameDraft, setNicknameDraft] = useState('');

  // Подключаемся, как только известны партия, игрок и его ник, и отключаемся
  // при размонтировании — оптимистичных ходов нет, состояние ждём с сервера
  useEffect(() => {
    if (!partyId || !nickname) {
      return undefined;
    }

    socketService.connect({ partyId, playerId, nickname });

    return () => {
      socketService.disconnect();
      partyStore.reset();
    };
  }, [nickname, partyId, playerId]);

  const handleSubmitNickname = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const trimmed = nicknameDraft.trim();

    if (trimmed) {
      setNickname(trimmed);
    }
  };

  if (!partyId) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 py-6">
        <p className="font-golos">Партия не найдена</p>
      </main>
    );
  }

  if (!nickname) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4">
        <h1 className="font-unbounded text-2xl">Как тебя называть?</h1>
        <form className="flex flex-col gap-3" onSubmit={handleSubmitNickname}>
          <Input
            onChange={event => setNicknameDraft(event.target.value)}
            placeholder="Ник"
            value={nicknameDraft}
          />
          <Button disabled={!nicknameDraft.trim()} type="submit">
            Войти в партию
          </Button>
        </form>
      </main>
    );
  }

  if (partyStore.error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-golos">{partyStore.error}</p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              partyStore.setError(undefined);
              socketService.connect({ partyId, playerId, nickname });
            }}
          >
            Попробовать снова
          </Button>
          {/* Если сервер отказал из-за занятого ника, повтор с тем же ником */}
          {/* будет падать бесконечно — нужен путь назад, к полю ввода */}
          <Button onClick={() => setNickname('')} type="button" variant="outline">
            Ввести другой ник
          </Button>
        </div>
      </main>
    );
  }

  if (!partyStore.view) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 py-6">
        <p className="font-golos">Подключаемся</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-6">
      {partyStore.view.phase === LucidShared.EPartyPhase.LOBBY
        ? <Lobby />
        : <p className="font-golos">{partyStore.view.phase}</p>}
    </main>
  );
});
