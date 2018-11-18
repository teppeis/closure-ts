'use strict';

const fs = require('fs');
const assert = require('assert');
const printer = require('../lib/printer');

const fixturePath = `${__dirname}/fixtures/printer`;

describe.only('printer', () => {
  it('default class', () => {
    const propInfo = {
      name: 'prop1',
      kind: 'VarInfo',
      type: 'string',
      isStatic: false,
      comment: {value: '*\n * @type {string}\n '},
    };
    const methodInfo = {
      name: 'hello',
      kind: 'FunctionInfo',
      type: '(message: string): void',
      templates: [],
      isStatic: false,
      comment: {value: '*\n '},
    };
    const classInfo = {
      name: 'goog.ui.Control',
      kind: 'ClassInfo',
      type: 'ClassType',
      cstr: '()',
      parents: ['goog.ui.Component', 'goog.Disposable'],
      templates: ['T'],
      methods: [methodInfo],
      props: [propInfo],
      comment: {value: '*\n '},
    };
    const otherInfo = {
      name: 'goog.ui.Component',
      kind: 'ClassInfo',
      type: 'ClassType',
      cstr: '()',
      parents: [],
      templates: [],
      methods: [],
      props: [],
      comment: {value: '*\n '},
    };
    const pkg = {
      provides: ['goog.ui.Control', 'goog.ui.Component'],
      requires: ['goog.Disposable'],
      items: {
        'goog.ui.Control': classInfo,
        'goog.ui.Component': otherInfo,
      },
    };
    const actual = printer.outputPackage(pkg);
    assert.deepEqual(actual, [
      {
        name: 'goog.ui.Control',
        code: fs.readFileSync(`${fixturePath}/module-simple-control.d.ts`, 'utf8'),
      },
      {
        name: 'goog.ui.Component',
        code: fs.readFileSync(`${fixturePath}/module-simple-component.d.ts`, 'utf8'),
      },
    ]);
  });

  it('member function', () => {
    const functionInfo = {
      name: 'goog.functions',
      kind: 'FunctionInfo',
      type: '(): string',
      templates: [],
      isStatic: false,
      comment: {value: '*\n '},
    };
    const functionInfoHello = {
      name: 'goog.functions.hello',
      kind: 'FunctionInfo',
      type: '(message: string): void',
      templates: [],
      isStatic: false,
      comment: {value: '*\n '},
    };
    const pkg = {
      provides: ['goog.functions'],
      requires: [],
      items: {
        'goog.functions': functionInfo,
        'goog.functions.hello': functionInfoHello,
      },
    };
    const actual = printer.outputPackage(pkg);
    assert.deepEqual(actual, [
      {
        name: 'goog.functions',
        code: fs.readFileSync(`${fixturePath}/module-member.d.ts`, 'utf8'),
      },
    ]);
  });
});
