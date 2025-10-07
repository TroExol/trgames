import type { Preview } from '@storybook/react';
import React from 'react';

import '../src/index.css';
import { ThemeProvider } from '../src/providers/ThemeProvider';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground p-6">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
