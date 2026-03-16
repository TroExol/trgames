import { localStorageService } from '@/services';

import { SettingsStore } from './SettingsStore';

export const settingsStore = new SettingsStore(localStorageService);
