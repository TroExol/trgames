import type { CSSProperties } from 'react';

import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

interface TProps {
  text: string;
  className?: string;
  style?: CSSProperties;
}

const THEME_VARIABLES = ['--lucid-base', '--lucid-text'];

// На телефоне title не всплывает: полный текст по тапу. Поповер уходит в
// портал вне темы партии, поэтому переменные цвета берутся у триггера и
// кладутся на сам поповер
export const TruncatedText = observer(function TruncatedText({ text, className, style }: TProps) {
  const [themeStyle, setThemeStyle] = useState<CSSProperties>();

  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpenChange = (isOpen: boolean): void => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    const computed = getComputedStyle(triggerRef.current);

    setThemeStyle(Object.fromEntries(THEME_VARIABLES.map(name => [name, computed.getPropertyValue(name)])));
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={`${className ?? ''} text-left`}
          ref={triggerRef}
          style={style}
          type="button"
        >
          {text}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto max-w-[min(20rem,calc(100vw-1.5rem))] break-words border-0 text-sm"
        style={{
          ...themeStyle,
          backgroundColor: 'var(--lucid-base)',
          color: 'var(--lucid-text)',
          boxShadow: '0 0 0 1px var(--lucid-text)',
        }}
      >
        {text}
      </PopoverContent>
    </Popover>
  );
});
