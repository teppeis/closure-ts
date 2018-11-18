import clc from 'cli-color';
import commander from 'commander';
import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import { generate } from './generator';

class Logger {
  private color_: boolean;
  private messages_: string[];
  private stdout: NodeJS.WritableStream;
  private stderr: NodeJS.WritableStream;
  constructor(enableColor: boolean, stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream) {
  this.color_ = !!enableColor;
  this.messages_ = [];
  this.stdout = stdout;
  this.stderr = stderr;
}

raw(msg: string) {
  this.messages_.push(msg);
}

info(msg: string) {
  this.messages_.push(msg);
};

warn(msg: string) {
  this.messages_.push(this.color_ ? clc.yellow(msg) : msg);
};

error(msg: string) {
  this.messages_.push(this.color_ ? clc.red(msg) : msg);
};

success(msg: string) {
  this.messages_.push(this.color_ ? clc.green(msg) : msg);
};

items(items: string[]) {
  if (items.length === 0) {
    items = ['(none)'];
  }
  this.messages_ = this.messages_.concat(
    items.map((item) => {
      item = `- ${item}`;
      return this.color_ ? clc.blackBright(item) : item;
    }, this)
  );
};

flush(success: boolean) {
  const out = success ? this.stdout : this.stderr;
  this.messages_.forEach(msg => {
    out.write(`${msg}\n`);
  });
  this.empty();
};

empty() {
  this.messages_ = [];
};
}

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
export default function main(argv: string[], stdout, stderr, exit) {
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
    try {
      const generated = generate(code);
      if (generated) {
        const relativePath = path.relative(`${__dirname}/../closure-library`, file);
        const filepath = path
          .join(`${__dirname}/../closure-library.d.ts`, relativePath)
          .replace(/\.js$/, '.d.ts');
        mkdirp.sync(path.dirname(filepath));
        fs.writeFileSync(filepath, generated);
      }
    } catch (e) {
      console.error(file, e);
    }
  });
}