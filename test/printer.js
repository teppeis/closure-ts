'use strict';

const fs = require('fs');
const assert = require('assert');
const printer = require('../lib/printer');
const {PackagePrinter} = printer;

const fixturePath = `${__dirname}/fixtures/printer`;

describe.only('printer', () => {
  it('provided class', () => {
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
      cstr: '(disposable: goog_disposable_IDisposable)',
      parents: ['goog.ui.Component'],
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
      requires: ['goog.disposable.IDisposable'],
      items: {
        'goog.ui.Control': classInfo,
        'goog.ui.Component': otherInfo,
      },
    };
    const actual = new PackagePrinter(pkg).output();
    assert.deepEqual(Array.from(actual), [
      ['goog.ui.Control', fs.readFileSync(`${fixturePath}/module-simple-control.d.ts`, 'utf8')],
      ['goog.ui.Component', fs.readFileSync(`${fixturePath}/module-simple-component.d.ts`, 'utf8')],
    ]);
  });

  it('module members', () => {
    const functionInfo = {
      name: 'goog.functions',
      kind: 'FunctionInfo',
      type: '(): string',
      templates: [],
      isStatic: false,
      comment: {value: '*\n '},
    };
    const functionInfoFn = {
      name: 'goog.functions.fn',
      kind: 'FunctionInfo',
      type: '(message: string): void',
      templates: [],
      isStatic: false,
      comment: {value: '*\n '},
    };
    const varInfo = {
      name: 'goog.functions.v',
      kind: 'VarInfo',
      type: 'Date',
      isStatic: false,
      comment: {value: '*\n '},
    };
    const typedefInfo = {
      name: 'goog.functions.Typedef',
      kind: 'TypedefInfo',
      type: 'RegExp',
      comment: {value: '*\n '},
    };
    const classInfo = {
      name: 'goog.functions.MyClass',
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
      provides: ['goog.functions'],
      requires: [],
      items: {
        'goog.functions': functionInfo,
        'goog.functions.fn': functionInfoFn,
        'goog.functions.v': varInfo,
        'goog.functions.MyClass': classInfo,
        'goog.functions.Typedef': typedefInfo,
      },
    };
    const actual = new PackagePrinter(pkg).output();
    assert.deepEqual(Array.from(actual), [
      ['goog.functions', fs.readFileSync(`${fixturePath}/module-member.d.ts`, 'utf8')],
    ]);
  });
});
