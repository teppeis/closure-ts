'use strict';

const importESLintConfig = require('tslint-import-eslint-config');
const prettierrc = require('eslint-config-teppeis/.prettierrc');
module.exports = importESLintConfig({
  extends: require(`${__dirname}/.eslintrc.json`).extends,
});

module.exports.extends.push('tslint-plugin-prettier');
Object.assign(module.exports.rules, {
  prettier: [true, prettierrc],
  'valid-jsdoc': false,
  'no-invalid-this': false,
  'no-unused-variable': false,
});
