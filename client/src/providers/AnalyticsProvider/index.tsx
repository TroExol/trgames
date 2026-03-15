import type { FC, ReactNode } from 'react';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { observer } from 'mobx-react-lite';
import { PostHogProvider } from '@posthog/react';

import { analyticsService } from '@/services';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = 'https://us.i.posthog.com';

interface TProps {
  children: ReactNode;
}

export const AnalyticsProvider: FC<TProps> = observer(({ children }) => {
  useEffect(() => {
    analyticsService.init(POSTHOG_KEY, POSTHOG_HOST);
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
