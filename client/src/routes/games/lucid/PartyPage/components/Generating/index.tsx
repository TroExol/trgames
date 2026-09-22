import { observer } from 'mobx-react-lite';

import { partyStore } from '@/routes/games/lucid/PartyPage/stores';

// Ожидание устроено как раскрытие, а не как полоса загрузки: стадия видна по
// тому, что уже пришло, а не по таймеру. Мир приходит первым и быстро —
// к первому броску игроки уже посмотрели, какой мир им достался
export const Generating = observer(function Generating() {
  const { view } = partyStore;
  const theme = view?.theme;

  if (!theme) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-unbounded text-xl">Придумываем мир</p>
        <span
          className="size-2 rounded-full motion-safe:animate-pulse"
          style={{ backgroundColor: 'var(--lucid-accent)' }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1 className="font-unbounded text-3xl motion-safe:duration-700 motion-safe:animate-in motion-safe:fade-in">
        {theme.name}
      </h1>
      <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>
        {`здесь считают: ${theme.resourceName}`}
      </p>

      {/* Молчать про запасную партию нельзя: игроки предложили темы, кубик
          выбрал одну, а мир оказался другим — это заметно всем. Строка
          признаёт промах игры, а не винит игроков или «сервис» */}
      {view.usedFallback && (
        <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>
          Мир придумать не вышло — играем на заготовленном.
        </p>
      )}

      <p className="text-sm">Чертим тропу</p>
    </div>
  );
});
