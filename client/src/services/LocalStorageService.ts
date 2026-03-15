class LocalStorageService {
  private readonly cache = new Map<string, string>();
  private readonly isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  public get(key: string): string | null {
    if (this.isAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        // Fallthrough к кэшу
      }
    }
    return this.cache.get(key) ?? null;
  }

  public set(key: string, value: string): void {
    if (this.isAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // Fallthrough к кэшу (quota exceeded и т.п.)
      }
    }
    this.cache.set(key, value);
  }

  public remove(key: string): void {
    if (this.isAvailable) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // Fallthrough к кэшу
      }
    }
    this.cache.delete(key);
  }

  private checkAvailability(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const testKey = '__trgames_storage_test__';
    try {
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

export const localStorageService = new LocalStorageService();
