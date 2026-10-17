import type { LucidShared } from '@trgames/shared';

import { observer } from 'mobx-react-lite';

import { Button } from '@/components/ui/Button';

import { OptionOutcomes } from './OptionOutcomes';

interface TProps {
  option: LucidShared.TOptionView;
  resource: number;
  resourceName: string;
  disabled: boolean;
  // Просмотр чужого выбора: кнопка выключена, но читается как обычная
  isPreview?: boolean;
  onClick: () => void;
}

export const OptionButton = observer(function OptionButton({
  option,
  resource,
  resourceName,
  disabled,
  isPreview = false,
  onClick,
}: TProps) {
  const missing = option.cost ? option.cost - resource : 0;
  // Невозможное нельзя и нажать: тогда отказ сервера перестаёт быть событием
  // для человека
  const isTooExpensive = missing > 0;
  const notes = [
    // Порог показывается всегда, а не при наведении: решение принимается по нему
    option.threshold ? `нужно ${option.threshold} и больше на кубике` : undefined,
    // Название ресурса нейросетевое, склонять его по числу нечем — оно
    // остаётся в верхней полосе, а здесь подпись со значением: «цена 5»
    option.cost ? `цена ${option.cost}` : undefined,
  ].filter(Boolean);

  return (
    <Button
      className={`h-auto w-full flex-col items-start gap-1 whitespace-normal border-2 bg-transparent px-4 py-3 text-left font-normal hover:bg-transparent ${isPreview && !isTooExpensive ? 'disabled:opacity-100' : 'disabled:opacity-60'}`}
      disabled={disabled || isPreview || isTooExpensive}
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

      <OptionOutcomes option={option} resourceName={resourceName} />

      {/* Вариант виден, но недоступен: рядом стоит то, что есть, — разница с
          ценой читается сама */}
      {isTooExpensive && (
        <span className="text-sm leading-snug" style={{ color: 'var(--lucid-accent)' }}>
          {`${isPreview ? 'у ходящего' : 'у тебя'} ${resource}`}
        </span>
      )}
    </Button>
  );
});
