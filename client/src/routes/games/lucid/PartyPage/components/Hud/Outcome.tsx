import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { Button } from '@/components/ui/Button';

const AUTO_CLOSE_MS = 6000;

interface TProps {
  lines: string[];
  onClose: () => void;
}

// Итог только что разыгранного варианта — виден всем, не только выбравшему.
// Стоит в общем потоке нижней полосы (не поверх поля, не inset-0): Бросить
// кубик остаётся нажимаемым всё это время, следующий ход ничем не заблокирован.
// Закрывается сама по таймеру — без кнопки «Дальше», чтобы не требовать
// действия ни от кого: карточка сама уходит с дороги
export const Outcome = observer(function Outcome({ lines, onClose }: TProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, AUTO_CLOSE_MS);

    return () => window.clearTimeout(timer);
  }, [lines, onClose]);

  return (
    <div
      className="flex flex-col gap-1 rounded-md border-2 px-3 py-2"
      style={{ borderColor: 'var(--lucid-accent)', backgroundColor: 'var(--lucid-veil)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <ul className="flex min-w-0 grow flex-col gap-0.5 text-sm">
          {lines.map(line => <li key={line}>{line}</li>)}
        </ul>

        <Button
          className="shrink-0 bg-transparent hover:bg-transparent"
          onClick={onClose}
          size="sm"
          style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
          variant="outline"
        >
          Дальше
        </Button>
      </div>
    </div>
  );
});
