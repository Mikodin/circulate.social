module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.scss'],
      },
      typescript: {
        directory: './packages/*/tsconfig.json',
      },
    },
  },
  extends: [
    'airbnb-base',
    'plugin:react/recommended',
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],

  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      { devDependencies: ['**/*.test.ts', '**/*.test.tsx'] },
    ],
    'import/no-cycle': 0,
    'prettier/prettier': 'error',
    'import/prefer-default-export': 0,
    '@typescript-eslint/no-unused-vars': ['error'],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        mjs: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
  },
};
