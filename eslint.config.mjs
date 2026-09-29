import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

// Old code under src/components/ and src/web.js is replaced route by route
// (see wiki/rewrite.md) and is not linted; everything else is.
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/components/**',
      'src/web.js',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    files: ['*.config.js', '*.config.mjs', 'e2e/**', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['test/**'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
  {
    // New code may not reach back into the old component tree.
    files: ['src/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)components/',
              message: 'New code must not import from src/components/ (old UI being replaced).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression[source.value=/(^|\\/)components\\//]',
          message: 'New code must not import from src/components/ (old UI being replaced).',
        },
      ],
    },
  },
]
