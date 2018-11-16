'use strict';

const fs = require('fs');
const diff = require('diff');
const generator = require('../lib/generator');

describe('Generator', () => {
  const files = fs.readdirSync(`${__dirname}/fixtures`);
  return files
    .filter(file => /\.js$/.test(file))
    .forEach(file =>
      it(file, () => {
        const code = fs.readFileSync(`${__dirname}/fixtures/${file}`, 'utf8');
        const actual = generator.generate(code);
        const expected = fs.readFileSync(
          `${__dirname}/fixtures/${file.replace(/\.js$/, '.d.ts')}`,
          'utf8'
        );
        if (actual !== expected) {
          diff.diffChars(expected, actual).forEach(part => {
            let value;
            value = part.value;
            value = part.added ? `[+${value}]` : part.removed ? `[-${value}]` : value;
            return process.stderr.write(value);
          });
          throw new Error('Different result');
        }
      })
    );
});
