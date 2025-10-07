import {
  afterEach,
  beforeEach,
  vi,
} from 'vitest';
import { vol } from 'memfs';

import { MOCKED_CURRENT_DATE } from './constants';

vi.mock('fs');
vi.mock('fs/promises');

vi.mock('@/helpers/Logger/Logger', () => {
  const Logger = vi.fn();
  Logger.prototype.debug = vi.fn((message: string) => {
    console.log(`[DEBUG] Mocked Logger: ${message}`);
  });
  Logger.prototype.info = vi.fn((message: string) => {
    console.log(`[INFO] Mocked Logger: ${message}`);
  });
  Logger.prototype.warn = vi.fn((message: string) => {
    console.log(`[WARN] Mocked Logger: ${message}`);
  });
  Logger.prototype.error = vi.fn((message: string) => {
    console.log(`[ERROR] Mocked Logger: ${message}`);
  });
  return { Logger };
});

vi.mock('@/helpers/FunctionResultObserver', () => {
  const FunctionResultObserver = vi.fn();
  FunctionResultObserver.mockImplementation(() => ({
    startObserve: vi.fn(),
    stopObserve: vi.fn(),
  }));
  return { FunctionResultObserver };
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MOCKED_CURRENT_DATE);
});

afterEach(() => {
  // reset the state of in-memory fs
  vol.reset();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
