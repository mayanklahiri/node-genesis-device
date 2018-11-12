module.exports = {
  rules: {
    'max-len': [2, 120],
  },
  env: {
    browser: false,
    es6: true,
    greasemonkey: false,
    node: true,
    jquery: false,
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  extends: 'google',
};
