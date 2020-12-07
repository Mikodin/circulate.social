module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'no-alert': 'off',
    'no-console': ['error', { allow: ['error'] }],
    'no-use-before-define': 1,
  },
};
