import { observer } from 'mobx-react-lite';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';

// Лента отвечает на вопрос «я отвлёкся, что я пропустил». Показывает только
// то, что прислал сервер: что произошло, а не что игрок выбрал из
// предложенного — иначе по ней читается чужая стратегия
export const Ribbon = observer(function Ribbon() {
  const { ribbon, ribbonTotal } = partyStore;

  const firstNumber = ribbonTotal - ribbon.length;

  return (
    <ul className="flex h-[2.2rem] flex-col justify-end gap-0.5 overflow-hidden text-xs leading-snug sm:h-[4.5rem] max-sm:[&>li:not(:nth-last-child(-n+2))]:hidden" style={{ color: 'var(--lucid-muted)' }}>
      {ribbon.map((line, index) => (
        <li
          className="truncate motion-safe:animate-in motion-safe:fade-in"
          key={firstNumber + index}
        >
          {line}
        </li>
      ))}
    </ul>
  );
});
