import type { LucidShared } from '@trgames/shared';

import { observer } from 'mobx-react-lite';

import { Button } from '@/components/ui/Button';

interface TProps {
  option: LucidShared.TOption;
  resource: number;
  resourceName: string;
  disabled: boolean;
  onClick: () => void;
}

export const OptionButton = observer(function OptionButton({
  option,
  resource,
  resourceName,
  disabled,
  onClick,
}: TProps) {
  const missing = option.cost ? option.cost - resource : 0;
  // Невозможное нельзя и нажать: тогда отказ сервера перестаёт быть событием
  // для человека
  const isTooExpensive = missing > 0;
  const notes = [
    // Порог показывается всегда, а не при наведении: решение принимается по нему
    option.threshold ? `нужно ${option.threshold} и больше на кубике` : undefined,
    option.cost ? `стоит ${option.cost} ${resourceName}` : undefined,
  ].filter(Boolean);

  return (
    <Button
      className="h-auto w-full flex-col items-start gap-1 whitespace-normal border-2 bg-transparent px-4 py-3 text-left font-normal hover:bg-transparent disabled:opacity-60"
      disabled={disabled || isTooExpensive}
      onClick={onClick}
      style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
      variant="outline"
    >
      <span className="text-base leading-snug">{option.text}</span>

      {notes.length > 0 && (
        <span className="text-sm leading-snug" style={{ color: 'var(--lucid-muted)' }}>
          {notes.join(' · ')}
        </span>
      )}

      {/* Вариант виден, но недоступен, и рядом сказано, сколько не хватает */}
      {isTooExpensive && (
        <span className="text-sm leading-snug" style={{ color: 'var(--lucid-accent)' }}>
          {`не хватает ${missing} ${resourceName}`}
        </span>
      )}
    </Button>
  );
});
