import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';
import { Button } from '@/components/ui/Button';

interface THandProps {
  canPlay: boolean;
  isSent: boolean;
  onPlay: (uid: number, targetId?: string) => void;
}

const BUTTON_STYLE = { borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' };

export const Hand = observer(function Hand({ canPlay, isSent, onPlay }: THandProps) {
  const [openUid, setOpenUid] = useState<number>();
  const [targetUid, setTargetUid] = useState<number>();
  const { state } = partyStore;

  if (!state) {
    return null;
  }

  const hand = state.G.cards.hands[state.you] ?? [];
  const opened = hand.find(item => item.uid === openUid);

  if (hand.length === 0) {
    return null;
  }

  const { resourceName } = state.G.theme;
  const targets = opened
    ? state.G.order.filter(playerId => LucidShared.canPlay(state.G, state.you, opened, playerId))
    : [];
  const text = opened && LucidShared.SHOP_TEXT[opened.card];
  const isPlayable = Boolean(
    opened
    && text?.kind === 'active'
    && canPlay
    && LucidShared.canPlay(state.G, state.you, opened),
  );

  const handlePlay = (): void => {
    if (!opened) {
      return;
    }

    if (opened.card === LucidShared.EShopCard.HAND_OF_FATE) {
      setTargetUid(opened.uid);

      return;
    }

    onPlay(opened.uid);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-wrap gap-1.5">
        {hand.map(item => (
          <li key={item.uid}>
            <button
              className="rounded border px-2 py-0.5 text-xs"
              onClick={() => {
                setOpenUid(item.uid === openUid ? undefined : item.uid);
                setTargetUid(undefined);
              }}
              style={{
                borderColor: 'var(--lucid-accent)',
                opacity: state.G.turn.used.includes(item.uid) ? 0.5 : 1,
              }}
              type="button"
            >
              {LucidShared.cardName(state.G, item.card)}
            </button>
          </li>
        ))}
      </ul>

      {opened && text && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs leading-snug" style={{ color: 'var(--lucid-muted)' }}>{text.rule(resourceName)}</p>

          {isPlayable && targetUid === undefined && (
            <Button
              className="w-full whitespace-normal border-2 bg-transparent hover:bg-transparent"
              disabled={isSent}
              onClick={handlePlay}
              size="sm"
              style={BUTTON_STYLE}
              variant="outline"
            >
              {`Применить · ${LucidShared.CARD_USE_PRICE}`}
            </Button>
          )}

          {isPlayable && targetUid === opened.uid && (
            <div className="flex flex-wrap gap-2">
              {targets.map(playerId => (
                <Button
                  className="whitespace-normal border-2 bg-transparent hover:bg-transparent"
                  disabled={isSent}
                  key={playerId}
                  onClick={() => onPlay(opened.uid, playerId)}
                  size="sm"
                  style={BUTTON_STYLE}
                  variant="outline"
                >
                  {state.G.players[playerId].nickname}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
