import { fileURLToPath } from 'url';
import tseslint from 'typescript-eslint';
import path from 'path';
import tailwind from 'eslint-plugin-tailwindcss';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactHooks from 'eslint-plugin-react-hooks';
import reactPlugin from 'eslint-plugin-react';
import perfectionistPlugin from 'eslint-plugin-perfectionist';
import pluginMobx from 'eslint-plugin-mobx';
import importNewline from 'eslint-plugin-import-newlines';
import trgamesPlugin from '@trgames/eslint-plugin-trgames';
import stylisticPlugin from '@stylistic/eslint-plugin';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ignoreFiles = {
  client: ['client/**/*', '!client/src/**/*', '!client/vite.config.ts'],
  server: ['server/**/*', '!server/src/**/*', '!server/vitest/**/*', '!server/__mocks__', '!server/vitest.config.mts'],
  shared: ['tools/shared/**/*', '!tools/shared/src/**/*'],
};

export default tseslint.config(
  {
    extends: [
      js.configs.recommended,
      perfectionistPlugin.configs['recommended-natural'],
      stylisticPlugin.configs.customize({
        blockSpacing: true,
        braceStyle: '1tbs',
        commaDangle: 'always-multiline',
        flat: true,
        indent: 2,
        quotes: 'single',
        semi: true,
      }),
    ],
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,tsx}'],
    ignores: ['**/.storybook/**/*', '.storybook/**/*', 'client/.storybook/**/*', ...Object.values(ignoreFiles).flat()],
    plugins: {
      'trgames': trgamesPlugin,
      'import-newlines': importNewline,
    },
    rules: {
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/indent-binary-ops': 'off',
      '@stylistic/lines-between-class-members': 'off',
      '@stylistic/object-curly-newline': ['error', { consistent: true, multiline: true }],
      '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      'import-newlines/enforce': [
        'error',
        {
          'items': 2,
          'max-len': 120,
          'semi': true,
        },
      ],
      'max-len': ['error', {
        code: 120,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      }],
      'no-restricted-imports': [
        'error',
        {
          paths: [],
          patterns: [
            {
              group: ['@trgames/shared/**/*'],
              message: 'Используйте импорт из @trgames/shared.',
            },
            {
              group: ['src/**/*'],
              message: 'Используйте импорт из @/',
            },
          ],
        },
      ],
      'no-shadow': 'warn',
      'perfectionist/sort-array-includes': 'off',
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-imports': ['error', {
        groups: [
          'type',
          ['builtin', 'external'],
          'internal-type',
          'internal',
          ['parent-type', 'sibling-type', 'index-type'],
          ['parent', 'sibling', 'index'],
          'object',
          'unknown',
        ],
        internalPattern: [
          '@/**',
        ],
        newlinesBetween: 'always',
        order: 'desc',
        type: 'natural',
      }],
      'perfectionist/sort-interfaces': 'off',
      'perfectionist/sort-maps': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',

      'perfectionist/sort-union-types': 'off',
    },
  },
  {
    files: ['**/*.{ts,mts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
    ],
    rules: {
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
    },
  },

  // server lint
  {
    extends: [
      {
        files: ['**/*.{ts,mts}'],
        languageOptions: {
          parserOptions: {
            projectService: true,
            tsconfigRootDir: path.resolve(__dirname, 'server'),
          },
        },
      },
      {
        files: ['server/**/*.test.ts', 'server/vitest/setup.ts'],
        rules: {
          '@typescript-eslint/no-explicit-any': 'off',
          '@typescript-eslint/no-shadow': 'off',
          '@typescript-eslint/no-unsafe-member-access': 'off',
        },
      },
      {
        files: ['server/src/games/cryptoz/i18n/translations/ru.ts'],
        rules: {
          'trgames/card-description-without-dot': 'error',
          'trgames/translations-starts-with-capital': 'error',
        },
      },
    ],
    files: ['server/**/*'],
    ignores: ignoreFiles.server,
  },
  // shared lint
  {
    extends: [
      {
        files: ['**/*.{ts,mts}'],
        languageOptions: {
          parserOptions: {
            projectService: true,
            tsconfigRootDir: path.resolve(__dirname, 'tools/shared'),
          },
        },
      },
      {
        files: ['games/cryptoz/card.ts'],
        rules: {
          'trgames/card-images-exist': [
            'error',
            {
              enumFilePath: path.resolve(__dirname, 'tools/shared/src/games/cryptoz/types/card.ts'),
              enumName: 'ECardId',
              imageDirPath: path.resolve(__dirname, 'client/src/assets/games/cryptoz/cards'),
              imageExtension: '.webp',
              overrideImageName: [
                {
                  id: '^chaos-[a-z]+$',
                  imageName: 'chaos',
                },
              ],
            },
          ],
          'trgames/card-classes-exist': [
            'error',
            {
              enumFilePath: path.resolve(__dirname, 'tools/shared/src/games/cryptoz/types/card.ts'),
              enumName: 'ECardId',
              classDirPath: path.resolve(__dirname, 'server/src/games/cryptoz/entities/Cards/customCards'),
            },
          ],
        },
      },
    ],
    files: ['tools/shared/**/*'],
    ignores: ignoreFiles.shared,
  },
  // client lint
  {
    extends: [
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
      pluginMobx.flatConfigs.recommended,
      ...tailwind.configs['flat/recommended'],
      {
        files: ['**/*.{ts,mts,tsx}'],
        languageOptions: {
          parserOptions: {
            projectService: true,
            tsconfigRootDir: path.resolve(__dirname, 'client'),
          },
        },
      },
    ],
    settings: {
      react: {
        version: 'detect',
      },
      tailwindcss: {
        callees: ['classnames', 'clsx', 'ctl', 'cn', 'cva'],
        config: path.resolve(__dirname, 'client/tailwind.config.js'),
        cssFiles: [
          __dirname + '/client/**/*.css',
          '!**/node_modules',
          '!**/.*',
          '!**/dist',
        ],
        cssFilesRefreshRate: 5_000,
        removeDuplicates: true,
        skipClassAttribute: false,
      },
    },
    files: ['client/**/*'],
    ignores: ignoreFiles.client,
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'mobx/exhaustive-make-observable': 'warn',
      'mobx/unconditional-make-observable': 'error',
      'mobx/missing-make-observable': 'error',
      'mobx/missing-observer': 'warn',
      'tailwindcss/no-custom-classname': 'off',
    },
  },
  {
    files: ['client/.storybook/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.storybook.json'],
        tsconfigRootDir: path.resolve(__dirname, 'client'),
      },
    },
  },
);
