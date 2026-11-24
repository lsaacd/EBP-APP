// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // eslint-config-expo@56+ upgrades eslint-plugin-react-hooks to v7, which promotes
    // new React Compiler heuristics (including false positives on Reanimated shared values
    // and existing modal reset effects) to errors. Keep them visible as warnings during
    // the SDK 58 upgrade without refactoring unrelated components.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
]);
