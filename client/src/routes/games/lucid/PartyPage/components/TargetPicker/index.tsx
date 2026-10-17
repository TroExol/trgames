import { observer } from 'mobx-react-lite';

import { Button } from '@/components/ui/Button';

interface TTarget {
  id: string;
  nickname: string;
}

interface TProps {
  targets: TTarget[];
  isSent: boolean;
  onPick: (targetId: string) => void;
}

const BUTTON_STYLE = { borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' };

export const TargetPicker = observer(function TargetPicker({ targets, isSent, onPick }: TProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {targets.map(target => (
        <Button
          className="whitespace-normal border-2 bg-transparent hover:bg-transparent"
          disabled={isSent}
          key={target.id}
          onClick={() => onPick(target.id)}
          size="sm"
          style={BUTTON_STYLE}
          variant="outline"
        >
          {target.nickname}
        </Button>
      ))}
    </div>
  );
});
