import type { FormEvent } from 'react';

import { toast } from 'sonner';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { socketService } from '@/routes/games/lucid/PartyPage/services';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

import { MemberRow } from './components/MemberRow';

// Партия раздаётся ссылкой, списка открытых партий нет — поэтому в лобби
// нужна сама ссылка, а не список комнат
const THEME_MAX_LENGTH = 60;
// Партия рассчитана на 2-6 игроков, запускать в одиночку нельзя
const MIN_MEMBERS_TO_START = 2;

// Отдельной кнопки готовности нет: ответ про тему (предложил или отказался) —
// и есть сигнал готовности
export const Lobby = observer(function Lobby() {
  const [themeDraft, setThemeDraft] = useState('');
  const { view } = partyStore;

  if (!view) {
    return null;
  }

  const you = view.members.find(member => member.playerId === view.you);
  const inviteLink = window.location.href;

  const handleCopyLink = (): void => {
    navigator.clipboard.writeText(inviteLink)
      .then(() => toast.success('Ссылка скопирована'))
      .catch(() => toast.error('Не удалось скопировать ссылку'));
  };

  const handleSubmitTheme = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const trimmed = themeDraft.trim();

    if (trimmed) {
      socketService.proposeTheme(trimmed);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-unbounded text-4xl">lucid</h1>
        <p className="font-golos">Партию придумывает нейросеть по теме, которую выберет кубик</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-golos text-sm text-muted-foreground">Партия раздаётся этой ссылкой</p>
        <Input readOnly value={inviteLink} />
        <Button onClick={handleCopyLink} type="button" variant="outline">
          Скопировать ссылку
        </Button>
      </div>

      <ul className="flex flex-col">
        {view.members.map(member => (
          <MemberRow isOwner={member.playerId === view.ownerId} key={member.playerId} member={member} />
        ))}
      </ul>

      {you && !you.hasAnswered && (
        <form className="flex flex-col gap-3" onSubmit={handleSubmitTheme}>
          <Input
            maxLength={THEME_MAX_LENGTH}
            onChange={event => setThemeDraft(event.target.value)}
            placeholder="Тема партии, например «заброшенная космическая станция»"
            value={themeDraft}
          />
          <div className="flex flex-col gap-2">
            <Button disabled={!themeDraft.trim()} type="submit">
              Предложить тему
            </Button>
            <Button onClick={socketService.declineTheme} type="button" variant="outline">
              Не хочу предлагать тему
            </Button>
          </div>
        </form>
      )}

      {you?.hasAnswered && (
        partyStore.isOwner
          ? (
              <Button
                className="whitespace-normal text-center"
                disabled={view.members.length < MIN_MEMBERS_TO_START}
                onClick={socketService.startParty}
              >
                Начать партию — состав закроется, генерация займёт одну-две минуты
              </Button>
            )
          : (
              <p className="text-center font-golos text-muted-foreground">Ждём остальных</p>
            )
      )}
    </div>
  );
});
