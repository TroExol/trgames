import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

import { TargetPicker } from '@/routes/games/lucid/PartyPage/components/TargetPicker';
import { Button } from '@/components/ui/Button';

import { OptionButton } from './OptionButton';

interface TProps {
  event: LucidShared.TEventView;
  // Ход не твой — варианты видны, но выключены: все читают одно и то же
  // событие, это общий момент партии
  isMyTurn: boolean;
  currentNickname: string;
  // Ресурс ходящего, а не смотрящего: «не по карману» считается от него
  resource: number;
  resourceName: string;
  // Оптимистичных ходов нет: после отправки кнопки молчат до нового stateId
  isSent: boolean;
  // Другие игроки: из них ходящий выбирает цель варианта с CHOSEN
  targets: { id: string; nickname: string }[];
  onChoose: (optionIndex: number, targetId?: string) => void;
  onCollapse: () => void;
}

// Карточка перекрывает поле целиком: текст и варианты читаются крупно, ничто
// не мешает. Закрыть нельзя, можно только свернуть
export const EventCard = observer(function EventCard({
  event,
  isMyTurn,
  currentNickname,
  resource,
  resourceName,
  isSent,
  targets,
  onChoose,
  onCollapse,
}: TProps) {
  const [pendingIndex, setPendingIndex] = useState<number>();
  const pending = pendingIndex === undefined ? undefined : event.options[pendingIndex];

  const handleOptionClick = (index: number): void => {
    if (LucidShared.hintNeedsTarget(event.options[index].hint)) {
      setPendingIndex(index);

      return;
    }

    onChoose(index);
  };

  return (
    <div
      className="absolute inset-0 z-20 overflow-y-auto backdrop-blur-sm"
      style={{ backgroundColor: 'var(--lucid-veil)' }}
    >
      {/* Строка до восьмидесяти знаков: длиннее глаз теряет начало следующей */}
      <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-5 px-4 pb-8 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-unbounded text-xl leading-tight">{event.title}</h2>

          <Button
            className="shrink-0 bg-transparent hover:bg-transparent"
            onClick={onCollapse}
            size="sm"
            style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
            variant="outline"
          >
            Свернуть
          </Button>
        </div>

        <p className="text-base leading-relaxed">{event.text}</p>

        {!isMyTurn && (
          <p className="text-sm" style={{ color: 'var(--lucid-muted)' }}>
            {`Выбирает ${currentNickname}`}
          </p>
        )}

        {pending && pendingIndex !== undefined
          ? (
              <div className="flex flex-col gap-3">
                <p className="text-base leading-snug">{`«${pending.text}» — кого выбрать?`}</p>

                <TargetPicker
                  isSent={isSent}
                  onPick={targetId => onChoose(pendingIndex, targetId)}
                  targets={targets}
                />

                <Button
                  className="self-start bg-transparent hover:bg-transparent"
                  onClick={() => setPendingIndex(undefined)}
                  size="sm"
                  style={{ borderColor: 'var(--lucid-accent)', color: 'var(--lucid-text)' }}
                  variant="outline"
                >
                  Назад
                </Button>
              </div>
            )
          : (
              <ul className="flex flex-col gap-3">
                {event.options.map((option, index) => (
                  <li key={option.text}>
                    <OptionButton
                      disabled={isSent}
                      isPreview={!isMyTurn}
                      onClick={() => handleOptionClick(index)}
                      option={option}
                      resource={resource}
                      resourceName={resourceName}
                    />
                  </li>
                ))}
              </ul>
            )}
      </div>
    </div>
  );
});
