import type {
  CryptozShared,
  EAnalyticsEvent,
  EAnalyticsPage,
} from '@trgames/shared';

import posthog from 'posthog-js';

import { localStorageService } from './LocalStorageService';

type TAnalyticsEvent = CryptozShared.EAnalyticsEvent | EAnalyticsEvent;
type TAnalyticsPage = CryptozShared.EAnalyticsPage | EAnalyticsPage;

const ANALYTICS_ID_KEY = 'trgames:analytics-id';

class AnalyticsService {
  private initialized = false;

  public init(apiKey: string, apiHost: string): void {
    if (this.initialized || !apiKey) {
      return;
    }

    posthog.init(apiKey, {
      api_host: apiHost,
      persistence: 'localStorage',
    });

    const distinctId = this.getOrCreateDistinctId();
    posthog.identify(distinctId);

    this.initialized = true;
  }

  public track(event: TAnalyticsEvent, properties?: Record<string, unknown>): void {
    if (!this.initialized) {
      return;
    }
    posthog.capture(event, properties);
  }

  public identify(traits?: Record<string, unknown>): void {
    if (!this.initialized) {
      return;
    }
    const distinctId = this.getOrCreateDistinctId();
    posthog.identify(distinctId, traits);
  }

  public page(name: TAnalyticsPage, properties?: Record<string, unknown>): void {
    if (!this.initialized) {
      return;
    }
    posthog.capture('$pageview', { pageName: name, ...properties });
  }

  public reset(): void {
    if (!this.initialized) {
      return;
    }
    posthog.reset();
  }

  private getOrCreateDistinctId(): string {
    let id = localStorageService.get(ANALYTICS_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorageService.set(ANALYTICS_ID_KEY, id);
    }
    return id;
  }
}

export const analyticsService = new AnalyticsService();
