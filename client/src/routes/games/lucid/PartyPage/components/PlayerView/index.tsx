import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { Button } from '@/components/ui/Button';

interface TProps {
  playerId: LucidShared.TPlayerId;
  onClose: () => void;
}

export const PlayerView = observer(function PlayerView({ playerId, onClose }: TProps) {
  const { state, view } = partyStore;
  const player = state?.G.players[playerId];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!state || !view || !player) {
    return null;
  }

  const { G } = state;
  const { resourceName } = G.theme;
  const isOffline = view.members.some(member => member.playerId === playerId && !member.isConnected);
  const hand = G.cards.hands[playerId] ?? [];
  const states = [
    player.skipTurns > 0 ? `пропускает ходов: ${player.skipTurns}` : undefined,
    player.cursed ? 'ждёт беду' : undefined,
    isOffline ? 'связь потеряна' : undefined,
    player.position === G.track.finishId ? 'у сейфа' : undefined,
  ].filter(Boolean);

  return (
    <div
      className="absolute inset-0 z-20 overflow-y-auto backdrop-blur-sm"
      style={{ backgroundColor: 'var(--lucid-veil)' }}
    >
      <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-5 px-4 pb-8 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="break-words font-unbounded text-xl leading-tight">{player.nickname}</h2>
          </div>

          <Button
            className="shrink-0 bg-transparent hover:bg-transparent"
            onClick={onClose}
            size="sm"
            style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
            variant="outline"
          >
            Закрыть
          </Button>
        </div>

        <p className="text-base">{`${resourceName} ${player.resource}`}</p>

        {states.length > 0 && (
          <ul className="flex flex-col gap-1 text-base">
            {states.map(item => <li key={item}>{item}</li>)}
          </ul>
        )}

        <div className="flex flex-col gap-3">
          <h3 className="font-unbounded text-sm">Рука</h3>

          {hand.length === 0 && <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>Карт нет</p>}

          <ul className="flex flex-col gap-3">
            {hand.map(item => {
              const text = LucidShared.SHOP_TEXT[item.card];
              const flavor = G.cardNames?.[item.card]?.flavor;

              return (
                <li
                  className="flex flex-col gap-1 rounded-md border-2 px-4 py-3"
                  key={item.uid}
                  style={{ borderColor: 'var(--lucid-accent)' }}
                >
                  <p className="font-unbounded text-base">{LucidShared.cardName(G, item.card)}</p>
                  {flavor && <p className="text-sm italic" style={{ color: 'var(--lucid-muted)' }}>{flavor}</p>}
                  <p className="text-sm leading-relaxed">{text.rule(resourceName)}</p>
                  <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>
                    {text.kind === 'active' ? `активная · ${LucidShared.CARD_USE_PRICE}` : 'пассивная'}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
});
