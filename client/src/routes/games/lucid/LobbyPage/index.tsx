import type { FormEvent } from 'react';

import { useDocumentTitle } from 'usehooks-ts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { createParty, findParty } from '@/routes/games/lucid/PartyPage/services';
import { usePlayerId } from '@/hooks/usePlayerId';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const CODE_LENGTH = 4;

export const Component = observer(function LucidLobbyPage() {
  useDocumentTitle('lucid — новая партия');

  const navigate = useNavigate();
  const playerId = usePlayerId();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [code, setCode] = useState('');

  const handleCreateParty = (): void => {
    setIsCreating(true);

    createParty(playerId)
      .then(partyId => navigate(`/game/lucid/party/${partyId}`))
      .catch((error: unknown) => {
        toast.error((error instanceof Error && error.message) || 'Неизвестная ошибка');
        setIsCreating(false);
      });
  };

  const handleJoinByCode = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setIsJoining(true);

    findParty(playerId, code)
      .then(partyId => navigate(`/game/lucid/party/${partyId}`))
      .catch((error: unknown) => {
        toast.error((error instanceof Error && error.message) || 'Неизвестная ошибка');
        setIsJoining(false);
      });
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="font-unbounded text-4xl">lucid</h1>
      </div>
      <Button disabled={isCreating} onClick={handleCreateParty}>
        {isCreating ? 'Создаём партию…' : 'Создать нейропартию'}
      </Button>
      <form className="flex flex-col gap-2" onSubmit={handleJoinByCode}>
        <Input
          aria-label="Код партии"
          autoComplete="off"
          inputMode="numeric"
          maxLength={CODE_LENGTH}
          name="code"
          onChange={event => setCode(event.target.value.replace(/\D/g, ''))}
          placeholder="Войти по коду"
          value={code}
        />
        <Button disabled={code.length !== CODE_LENGTH || isJoining} type="submit" variant="outline">
          Войти
        </Button>
      </form>
    </main>
  );
});
