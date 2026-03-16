import type { FC, ReactNode } from 'react';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { observer } from 'mobx-react-lite';
import { EAnalyticsEvent } from '@trgames/shared';
import { PostHogProvider } from '@posthog/react';

import { analyticsService } from '@/services';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;

analyticsService.init(POSTHOG_KEY, POSTHOG_HOST);

interface TProps {
  children: ReactNode;
}

export const AnalyticsProvider: FC<TProps> = observer(({ children }) => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analyticsService.track(EAnalyticsEvent.ERROR_OCCURRED, {
        message: event.message,
        page: window.location.pathname,
        stack: (event.error as Error | undefined)?.stack,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analyticsService.track(EAnalyticsEvent.ERROR_OCCURRED, {
        message: String(event.reason),
        page: window.location.pathname,
        stack: (event.reason as Error | undefined)?.stack,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  );
});
