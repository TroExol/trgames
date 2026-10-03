import { observer } from 'mobx-react-lite';

import { Button } from '@/components/ui/Button';

export interface TCardPickItem {
  key: string;
  name: string;
  rule: string;
  actionLabel: string;
  disabled?: boolean;
}

interface TCardPickProps {
  title: string;
  items: TCardPickItem[];
  isSent: boolean;
  onPick: (index: number) => void;
  onSkip?: () => void;
  skipLabel?: string;
}

const BUTTON_STYLE = { borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' };

export const CardPick = observer(function CardPick({
  title,
  items,
  isSent,
  onPick,
  onSkip,
  skipLabel,
}: TCardPickProps) {
  return (
    <div
      className="absolute inset-0 z-20 overflow-y-auto backdrop-blur-sm"
      style={{ backgroundColor: 'var(--lucid-veil)' }}
    >
      <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-5 px-4 pb-8 pt-4">
        <h2 className="font-unbounded text-xl leading-tight">{title}</h2>

        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li
              className="flex flex-col gap-2 rounded border-2 p-3"
              key={item.key}
              style={{ borderColor: 'var(--lucid-accent)' }}
            >
              <p className="font-unbounded text-base">{item.name}</p>
              <p className="text-sm leading-relaxed">{item.rule}</p>
              <Button
                className="w-full whitespace-normal bg-transparent hover:bg-transparent"
                disabled={item.disabled || isSent}
                onClick={() => onPick(index)}
                style={BUTTON_STYLE}
                variant="outline"
              >
                {item.actionLabel}
              </Button>
            </li>
          ))}
        </ul>

        {onSkip && (
          <Button
            className="w-full whitespace-normal bg-transparent hover:bg-transparent"
            disabled={isSent}
            onClick={onSkip}
            style={BUTTON_STYLE}
            variant="outline"
          >
            {skipLabel}
          </Button>
        )}
      </div>
    </div>
  );
});
