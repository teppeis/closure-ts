// Load all type definition files.
/// <reference path="./closure-library.d.ts/all.d.ts" />

// Install closure-library bootstrap for node.js.
declare function require(name: string): any;

export function register() {
  require('./closure-library/closure/goog/bootstrap/nodejs');
}
