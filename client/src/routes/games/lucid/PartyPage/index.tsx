import type { FormEvent, ReactNode } from 'react';

import { useParams } from 'react-router-dom';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import type { TMood } from '@/lib/lucid/colors';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { socketService } from '@/routes/games/lucid/PartyPage/services';
import { Lobby } from '@/routes/games/lucid/PartyPage/components/Lobby';
import { Generating } from '@/routes/games/lucid/PartyPage/components/Generating';
import { Board } from '@/routes/games/lucid/PartyPage/components/Board';
import { themeStyle } from '@/lib/lucid/theme';
import { deriveRoles } from '@/lib/lucid/colors';
import { usePlayerId } from '@/hooks/usePlayerId';
import { useNickname } from '@/hooks/useNickname';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const Component = observer(function LucidPartyPage() {
  const { partyId } = useParams();
  const playerId = usePlayerId();
  const [nickname, setNickname] = useNickname();
  const [nicknameDraft, setNicknameDraft] = useState('');
  const theme = partyStore.view?.theme;
  // Оформление считается один раз на изменение темы и вешается на корень
  // экрана партии, а не на отдельный экран: смена фазы не должна сбрасывать
  // тему. Поля mood может не быть — тогда решает средняя светлота палитры
  const roles = useMemo(
    () => deriveRoles(theme?.palette ?? [], theme?.mood as TMood | undefined),
    [theme?.palette, theme?.mood],
  );
  // Оформление применяется, как только пришла тема, и дальше не сбрасывается.
  // До неё лобби остаётся в цветах сайта: подставить сюда цвета несуществующей
  // темы значило бы перекрасить текст, но не кнопки, и они слились бы с фоном
  const style = useMemo(
    () => (theme ? themeStyle(roles, theme.name) : undefined),
    [roles, theme],
  );

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

  const { state, view } = partyStore;

  if (!view) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 py-6">
        <p className="font-golos">Подключаемся</p>
      </main>
    );
  }

  // Ветка выбирается нажатием на само поле, и только тогда, когда выбор
  // действительно за тобой: иначе нажатие ушло бы в отказ сервера
  const isMyBranch = state?.ctx.phase === LucidShared.EPhase.BRANCH && partyStore.isMyTurn;

  const handleSelectCell = (cellId: number): void => {
    if (!state) {
      return;
    }

    socketService.makeMove({
      cellId,
      playerId: state.you,
      stateId: state.stateId,
      type: LucidShared.EMoveType.CHOOSE_BRANCH,
    });
  };

  const renderBody = (): ReactNode => {
    if (view.phase === LucidShared.EPartyPhase.LOBBY) {
      return (
        <div className="min-h-0 grow overflow-y-auto px-4 py-6">
          <Lobby />
        </div>
      );
    }

    if (!state) {
      return (
        <div className="flex min-h-0 grow items-center justify-center overflow-y-auto p-6">
          <Generating />
        </div>
      );
    }

    return (
      <>
        <div className="flex min-h-0 grow px-2">
          <Board
            onSelectCell={isMyBranch ? handleSelectCell : undefined}
            state={state}
          />
        </div>
      </>
    );
  };

  return (
    // Высота берётся растяжением по общей раскладке, а не из min-height:
    // при min-height высота остаётся неопределённой, h-full у поля
    // схлопывается, и оно возвращается к своим пропорциям. Дать сюда h-dvh
    // тоже нельзя: над экраном партии стоит шапка сайта, и страница уехала бы
    // за нижний край вместе с нижней полосой
    <main className="relative flex h-0 w-full grow flex-col overflow-hidden font-golos" style={style}>
      {renderBody()}
    </main>
  );
});
