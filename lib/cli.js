'use strict';

const fs = require('fs');
const path = require('path');
const clc = require('cli-color');
const commander = require('commander');
const mkdirp = require('mkdirp');
const generator = require('./generator');

const Logger = function(enableColor, stdout, stderr) {
  this.color_ = !!enableColor;
  this.messages_ = [];
  this.stdout = stdout;
  this.stderr = stderr;
};

Logger.prototype.raw = function(msg) {
  this.messages_.push(msg);
};

Logger.prototype.info = function(msg) {
  this.messages_.push(msg);
};

Logger.prototype.warn = function(msg) {
  this.messages_.push(this.color_ ? clc.yellow(msg) : msg);
};

Logger.prototype.error = function(msg) {
  this.messages_.push(this.color_ ? clc.red(msg) : msg);
};

Logger.prototype.success = function(msg) {
  this.messages_.push(this.color_ ? clc.green(msg) : msg);
};

Logger.prototype.items = function(items) {
  if (items.length === 0) {
    items = ['(none)'];
  }
  this.messages_ = this.messages_.concat(
    items.map(function(item) {
      item = `- ${item}`;
      return this.color_ ? clc.blackBright(item) : item;
    }, this)
  );
};

Logger.prototype.flush = function(success) {
  const out = success ? this.stdout : this.stderr;
  this.messages_.forEach(msg => {
    out.write(`${msg}\n`);
  });
  this.empty();
};

Logger.prototype.empty = function() {
  this.messages_ = [];
};

function setCommandOptions(command) {
  return command
    .version(require('../package.json').version, '-v, --version')
    .usage('[options] files...')
    .option('--no-color', 'Disable color highlight.');
}

/**
 * @param {Array} argv
 * @param {Stream} stdout
 * @param {Stream} stderr
 * @param {function(number?)} exit
 */
function main(argv, stdout, stderr, exit) {
  const program = new commander.Command();
  setCommandOptions(program).parse(argv);

  if (program.args.length < 1) {
    program.outputHelp();
    exit(1);
  }

  const log = new Logger(program.color, stdout, stderr);

  program.args.forEach(file => {
    log.warn(`File: ${file}\n`);
    const code = fs.readFileSync(file, 'utf8');
    const generated = generator.generate(code);
    if (generated) {
      const relativePath = path.relative(`${__dirname}/../closure-library`, file);
      const filepath = path
        .join(`${__dirname}/../closure-library.d.ts`, relativePath)
        .replace(/\.js$/, '.d.ts');
      mkdirp.sync(path.dirname(filepath));
      fs.writeFileSync(filepath, generated);
    }
  });
}

module.exports = main;
