import { useDocumentTitle } from 'usehooks-ts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { createParty } from '@/routes/games/lucid/PartyPage/services';
import { usePlayerId } from '@/hooks/usePlayerId';
import { Button } from '@/components/ui/Button';

export const Component = observer(function LucidLobbyPage() {
  useDocumentTitle('lucid — новая партия');

  const navigate = useNavigate();
  const playerId = usePlayerId();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateParty = (): void => {
    setIsCreating(true);

    createParty(playerId)
      .then(partyId => navigate(`/game/lucid/party/${partyId}`))
      .catch((error: unknown) => {
        toast.error((error instanceof Error && error.message) || 'Неизвестная ошибка');
        setIsCreating(false);
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
    </main>
  );
});
