import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { Button } from '@/components/ui/Button';

interface TProps {
  option: LucidShared.TOptionView;
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
    // Название ресурса нейросетевое, склонять его по числу нечем — оно
    // остаётся в верхней полосе, а здесь подпись со значением: «цена 5»
    option.cost ? `цена ${option.cost}` : undefined,
  ].filter(Boolean);
  // Исход скрыт, пока ветка не раскрылась (кто-то её не задел): с порогом —
  // раздельно удача/провал, нераскрытая ветка — «удача/провал — ?» (вопрос,
  // а не пустая строка: игрок видит, что развилка есть, просто ещё неизвестна).
  // Без порога ветка одна — до раскрытия строки нет вовсе, показывать «?»
  // под единственным исходом было бы лишним драматизмом на пустом месте
  const outcomes = option.threshold
    ? [
        option.revealed.success
          ? `удача — ${option.success ? LucidShared.describeEffect(option.success, resourceName) : 'ничего'}`
          : 'удача — ?',
        option.revealed.failure
          ? `провал — ${option.failure ? LucidShared.describeEffect(option.failure, resourceName) : 'ничего'}`
          : 'провал — ?',
      ]
    : (option.revealed.success && option.success ? [LucidShared.describeEffect(option.success, resourceName)] : []);

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

      {outcomes.map(outcome => (
        <span className="text-sm leading-snug" key={outcome} style={{ color: 'var(--lucid-muted)' }}>
          {outcome}
        </span>
      ))}

      {/* Вариант виден, но недоступен: рядом стоит то, что есть, — разница с
          ценой читается сама */}
      {isTooExpensive && (
        <span className="text-sm leading-snug" style={{ color: 'var(--lucid-accent)' }}>
          {`у тебя ${resource}`}
        </span>
      )}
    </Button>
  );
});
