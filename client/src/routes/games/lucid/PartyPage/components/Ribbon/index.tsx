import { observer } from 'mobx-react-lite';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';

// Лента отвечает на вопрос «я отвлёкся, что я пропустил». Показывает только
// то, что прислал сервер: что произошло, а не что игрок выбрал из
// предложенного — иначе по ней читается чужая стратегия
export const Ribbon = observer(function Ribbon() {
  const { ribbon, ribbonTotal } = partyStore;

  if (ribbon.length === 0) {
    return null;
  }

  const firstNumber = ribbonTotal - ribbon.length;

  return (
    <ul className="flex flex-col gap-0.5 text-xs leading-snug" style={{ color: 'var(--lucid-muted)' }}>
      {ribbon.map((line, index) => (
        <li
          className="motion-safe:animate-in motion-safe:fade-in"
          key={firstNumber + index}
        >
          {line}
        </li>
      ))}
    </ul>
  );
});
