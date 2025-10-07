import type { StorybookConfig } from '@storybook/react-vite';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      resolve: {
        alias: {
          '@': resolve(projectRoot, 'src'),
        },
      },
    });
  },
};

export default config;
