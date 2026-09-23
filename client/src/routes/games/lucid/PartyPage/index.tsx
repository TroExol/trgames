import type { FormEvent, ReactNode } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import type { TLucidSound } from '@/services/LucidSoundService';
import type { TMood } from '@/lib/lucid/colors';

import { lucidSoundService } from '@/services/LucidSoundService';
import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { socketService } from '@/routes/games/lucid/PartyPage/services';
import { Lobby } from '@/routes/games/lucid/PartyPage/components/Lobby';
import { Hud } from '@/routes/games/lucid/PartyPage/components/Hud';
import { Generating } from '@/routes/games/lucid/PartyPage/components/Generating';
import { Ending } from '@/routes/games/lucid/PartyPage/components/Ending';
import { CellView } from '@/routes/games/lucid/PartyPage/components/CellView';
import { Board } from '@/routes/games/lucid/PartyPage/components/Board';
import { themeStyle } from '@/lib/lucid/theme';
import { deriveRoles } from '@/lib/lucid/colors';
import { usePlayerId } from '@/hooks/usePlayerId';
import { useNickname } from '@/hooks/useNickname';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// Звуки идут подряд, а не разом: бросок, шаг и открытие события случаются
// в одном присланном состоянии, и вместе они слились бы в кашу
const SOUND_GAP_MS = 280;

interface TSoundSnapshot {
  phase: LucidShared.EPhase;
  positions: string;
  resource: number;
  roll: string;
  stateId: number;
  winner?: string;
}

export const Component = observer(function LucidPartyPage() {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const playerId = usePlayerId();
  const [nickname, setNickname] = useNickname();
  const [nicknameDraft, setNicknameDraft] = useState('');
  // Просмотр посещённой клетки — своё состояние, не связанное с текущим
  // выбором: открывается и закрывается независимо от карточки события хода
  const [viewCellId, setViewCellId] = useState<number>();
  const previousSound = useRef<TSoundSnapshot>();
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

  // Номер новой партии приходит полем вида, а не строкой ленты, поэтому
  // переход случается у всех, а не только у нажавшего: остальные не нажимали
  // ничего, и оставить их на экране победы значило бы разорвать компанию
  const nextPartyId = partyStore.view?.nextPartyId;

  useEffect(() => {
    if (nextPartyId) {
      navigate(`/game/lucid/party/${nextPartyId}`);
    }
  }, [navigate, nextPartyId]);

  // Звуки короткие и понадобятся в первые же минуты: грузятся, как только
  // партия началась. Музыка при этом молчит до темы
  const hasState = Boolean(partyStore.state);

  useEffect(() => {
    if (hasState) {
      lucidSoundService.preload();
    }
  }, [hasState]);

  // Дорожка грузится лениво и только одна: настроение темы известно, вес
  // файла — четыре с лишним мегабайта, и партия его не ждёт
  const isDark = theme ? roles.isDark : undefined;

  useEffect(() => {
    if (isDark !== undefined) {
      lucidSoundService.playMusic(isDark ? 'dark' : 'light');
    }
  }, [isDark]);

  useEffect(() => () => lucidSoundService.stopMusic(), []);

  // Звук привязан к изменению присланного состояния, а не к нажатию кнопки:
  // ходы бывают и чужие, и автопилота
  const { state: partyState } = partyStore;

  useEffect(() => {
    if (!partyState) {
      previousSound.current = undefined;

      return undefined;
    }

    const snapshot: TSoundSnapshot = {
      phase: partyState.ctx.phase,
      positions: partyState.G.order.map(id => partyState.G.players[id].position).join(','),
      resource: partyState.G.players[partyState.you].resource,
      // Подпись броска: у одного и того же игрока два одинаковых броска подряд
      // прозвучат один раз — редкий случай, ради которого не стоит заводить
      // в состоянии счётчик бросков
      roll: JSON.stringify(partyState.G.lastRoll ?? null),
      stateId: partyState.stateId,
      winner: partyState.G.winner,
    };
    const before = previousSound.current;

    previousSound.current = snapshot;

    if (!before || before.stateId === snapshot.stateId) {
      return undefined;
    }

    const EPhase = LucidShared.EPhase;
    // Показ броска (PartyStore.reveal/walkSteps) уже озвучил и кубик, и шаги
    // по клеткам сам, в реальном времени — тут они бы прозвучали только
    // на коммите финального view, то есть с задержкой и без повтора на
    // каждую клетку. revealedStateId отмечает такой view, чтобы не озвучить
    // тот же переход дважды
    const wasRevealed = partyStore.revealedStateId === snapshot.stateId;
    const queue: TLucidSound[] = [
      !wasRevealed && snapshot.roll !== before.roll ? 'dice' : undefined,
      !wasRevealed && snapshot.positions !== before.positions ? 'step' : undefined,
      before.phase === EPhase.BRANCH && snapshot.phase !== EPhase.BRANCH ? 'branch' : undefined,
      snapshot.resource > before.resource ? 'resourceUp' : undefined,
      snapshot.resource < before.resource ? 'resourceDown' : undefined,
      before.phase !== EPhase.CHOICE && snapshot.phase === EPhase.CHOICE ? 'event' : undefined,
      snapshot.winner && !before.winner ? 'win' : undefined,
    ].filter((name): name is TLucidSound => name !== undefined);

    const timers = queue.slice(1).map((name, index) =>
      window.setTimeout(() => lucidSoundService.play(name), (index + 1) * SOUND_GAP_MS));

    if (queue[0]) {
      lucidSoundService.play(queue[0]);
    }

    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [partyState]);

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
        <h1 className="font-unbounded text-2xl" id="nickname-heading">Как тебя называть?</h1>
        <form className="flex flex-col gap-3" onSubmit={handleSubmitNickname}>
          <Input
            aria-labelledby="nickname-heading"
            name="nickname"
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
  const isMyBranch = state?.ctx.phase === LucidShared.EPhase.BRANCH
    && partyStore.isMyTurn
    && !partyStore.isRevealing;

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
        {/* Высота задана точно, а не минимумом: при min-height высота
            контейнера остаётся неопределённой, h-full у поля схлопывается,
            и оно возвращается к своим пропорциям. Отступы равны высоте полос:
            они лежат поверх поля, и без отступов под ними прятались бы
            крайние ряды клеток */}
        <div className="flex min-h-0 grow px-2 pb-32 pt-16">
          <Board
            onSelectCell={isMyBranch ? handleSelectCell : undefined}
            onViewCell={setViewCellId}
            state={state}
          />
        </div>

        <Hud />

        {/* Поле остаётся видимым вокруг экрана победы: партия закончилась
            на нём, и это стоит показать */}
        {view.phase === LucidShared.EPartyPhase.ENDED && <Ending />}

        {viewCellId !== undefined && state.G.events[viewCellId] && (
          <CellView
            event={state.G.events[viewCellId]}
            history={state.G.cellHistory[viewCellId] ?? []}
            onClose={() => setViewCellId(undefined)}
            resourceName={state.G.theme.resourceName}
          />
        )}
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
