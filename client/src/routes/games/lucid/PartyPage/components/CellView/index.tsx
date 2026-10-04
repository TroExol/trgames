import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { Button } from '@/components/ui/Button';

import { OptionOutcomes } from '../EventCard/OptionOutcomes';

interface TProps {
  event: LucidShared.TEventView;
  history: LucidShared.THistoryEntry[];
  hint: string;
  resourceName: string;
  onClose: () => void;
}

// Просмотр уже посещённой клетки: то же, что видел бы ходящий, но без кнопок
// выбора — и с историей того, что там уже случилось. Открывается только по
// клетке с историей (Board это гарантирует), поэтому событие и хотя бы одна
// запись здесь есть всегда
export const CellView = observer(function CellView({ event, hint, history, resourceName, onClose }: TProps) {
  return (
    <div
      className="absolute inset-0 z-20 overflow-y-auto backdrop-blur-sm"
      style={{ backgroundColor: 'var(--lucid-veil)' }}
    >
      <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-5 px-4 pb-8 pt-4">
        <p className="text-sm leading-snug" style={{ color: 'var(--lucid-muted)' }}>{hint}</p>

        <div className="flex items-start justify-between gap-3">
          <h2 className="font-unbounded text-xl leading-tight">{event.title}</h2>

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

        <p className="text-base leading-relaxed">{event.text}</p>

        <ul className="flex flex-col gap-3">
          {event.options.map(option => {
            const notes = [
              option.threshold ? `нужно ${option.threshold} и больше на кубике` : undefined,
              option.cost ? `цена ${option.cost}` : undefined,
            ].filter(Boolean);

            return (
              <li
                className="flex flex-col gap-1 rounded-md border-2 px-4 py-3"
                key={option.text}
                style={{ borderColor: 'var(--lucid-accent)' }}
              >
                <span className="text-base leading-snug">{option.text}</span>

                {notes.length > 0 && (
                  <span className="text-sm leading-snug" style={{ color: 'var(--lucid-muted)' }}>
                    {notes.join(' · ')}
                  </span>
                )}

                <OptionOutcomes option={option} resourceName={resourceName} />
              </li>
            );
          })}
        </ul>

        {history.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3 className="font-unbounded text-sm">История клетки</h3>
            <ul className="flex flex-col gap-1 text-sm">
              {history.map((entry, index) => (
                <li key={index}>
                  {LucidShared.describeHistoryEntry(entry, event.options[entry.optionIndex], resourceName)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});
