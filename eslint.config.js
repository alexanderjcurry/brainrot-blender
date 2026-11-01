// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Build scripts run in Node.
    files: ['scripts/**/*.js'],
    languageOptions: { globals: { __dirname: 'readonly' } },
  },
  {
    // React Three Fiber JSX (<mesh geometry=…>) uses three.js props that this rule doesn't know.
    files: ['src/three/**/*.tsx'],
    rules: { 'react/no-unknown-property': 'off' },
  },
]);
