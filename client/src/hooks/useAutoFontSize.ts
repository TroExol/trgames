import { useEffect, useRef } from 'react';

interface TUseAutoFontSizeOptions {
  minSize?: number;
  maxSize?: number;
  step?: number;
}

export const useAutoFontSize = (
  options: TUseAutoFontSizeOptions = {},
) => {
  const {
    minSize = 6,
    maxSize = 16,
    step = 0.5,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let currentSize = maxSize;

    // Устанавливаем начальный размер
    container.style.fontSize = `${currentSize}px`;

    // Уменьшаем размер, пока текст не поместится
    while (container.scrollHeight > container.clientHeight && currentSize > minSize) {
      currentSize -= step;
      container.style.fontSize = `${currentSize}px`;
    }
  }, [minSize, maxSize, step]);

  return { containerRef };
};
