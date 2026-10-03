import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';

export const LawsStrip = observer(function LawsStrip() {
  const { state } = partyStore;

  if (!state) {
    return null;
  }

  const { resourceName } = state.G.theme;

  return (
    <ul className="grid grid-cols-3 gap-2">
      {state.G.cards.laws.map((law, index) => (
        <li
          className={`min-w-0 rounded border px-1.5 py-1 ${law === null ? 'border-dashed' : ''}`}
          key={index}
          style={{ borderColor: 'var(--lucid-muted)' }}
        >
          {law === null
            ? (
                <p className="text-[11px]" style={{ color: 'var(--lucid-muted)' }}>пусто</p>
              )
            : (
                <>
                  <p className="font-unbounded text-xs">{LucidShared.LAW_TEXT[law].name}</p>
                  <p className="text-[11px] leading-tight" style={{ color: 'var(--lucid-muted)' }}>
                    {LucidShared.LAW_TEXT[law].rule(resourceName)}
                  </p>
                </>
              )}
        </li>
      ))}
    </ul>
  );
});
