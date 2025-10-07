import type { KeyboardEvent, KeyboardEventHandler } from 'react';

import { twMerge } from 'tailwind-merge';
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function onEnter(callback: (event: KeyboardEvent) => void) {
  const returnFunction: KeyboardEventHandler = event => {
    if (event.key === 'Enter') {
      callback(event);
    }
  };
  return returnFunction;
}
