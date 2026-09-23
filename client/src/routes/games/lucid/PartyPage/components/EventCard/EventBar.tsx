import { observer } from 'mobx-react-lite';

import { Button } from '@/components/ui/Button';

interface TProps {
  title: string;
  isMyTurn: boolean;
  currentNickname: string;
  onExpand: () => void;
}

// Свёрнутая карточка читается как «ход ждёт тебя», а не как «окно закрыто»:
// иначе игрок свернёт её и будет гадать, почему ничего не происходит. Полоса
// стоит над нижней полосой интерфейса и ничем не перекрывается
export const EventBar = observer(function EventBar({
  title,
  isMyTurn,
  currentNickname,
  onExpand,
}: TProps) {
  return (
    <div
      className="absolute inset-x-0 bottom-full flex items-center gap-2 border-t-2 px-3 py-2 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--lucid-veil)', borderColor: 'var(--lucid-accent)' }}
    >
      {/* Точка бьётся, пока ход не сделан: полоса не должна читаться как
          свёрнутое и забытое окно */}
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full motion-safe:animate-pulse"
        style={{ backgroundColor: 'var(--lucid-accent)' }}
      />

      <p className="min-w-0 grow truncate text-sm">
        {isMyTurn ? `Ход ждёт тебя: ${title}` : `Выбирает ${currentNickname}: ${title}`}
      </p>

      <Button
        className="shrink-0 bg-transparent hover:bg-transparent"
        onClick={onExpand}
        size="sm"
        style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
        variant="outline"
      >
        Развернуть
      </Button>
    </div>
  );
});
