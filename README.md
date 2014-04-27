closure-ts [![Build Status](https://travis-ci.org/teppeis/closure-ts.svg?branch=master)](https://travis-ci.org/teppeis/closure-ts)
====

> Generates TypeScript declaration files (.d.ts) from [Closure Library JSDoc annotations](https://developers.google.com/closure/compiler/docs/js-for-compiler).

From this JavaScript code with annotations,
```javascript
/**
 * Truncates a string to a certain length.
 * @param {string} str
 * @param {number} chars
 * @param {boolean=} opt_protectEscapedCharacters
 * @return {string}
 */
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
    // ...
};
```
closure-ts generates this declaration file (.d.ts).
```javascript
declare module goog.string {
    /**
     * Truncates a string to a certain length.
     * @param {string} str
     * @param {number} chars
     * @param {boolean=} opt_protectEscapedCharacters
     * @return {string}
     */
    export function truncate(str: string, chars: number, opt_protectEscapedCharacters?: boolean): string;
}
```

You can see more in [examples](https://github.com/teppeis/closure-ts/tree/master/examples) dir.

## Usage

```bash
$ closurets some-jsdoced-code.js
$ ls
some-jsdoced-code.d.ts
some-jsdoced-code.js
```

## Project status

Just PoC

### Implemented

* Variable with `@type`
* Function with `@param` and `@return`
* Enum with `@enum` to TypeScript `Interface`
* Namespace to TypeScript `module`
* Classes (`@constructor` and `@extends`)
* Convert `*` to `any`
* Generic type like `Array<number>`
* Generic function with `@template`
* Union type (partialy)
* Record type
* Rest parameters in `@param` and FunctionType
* Optional parameters
* Exclude `@private` definitions
* `@typedef` (partialy)
* Ignore features TypeScript doesn't have
    * `@this`
    * Nullable, Non-Nullable
    * `Object.<string, Some>`

### TODO

* Interfaces
* Generic classes
* Function `new` Type
* `@lends`
* Expand union type
* Dependencies of Closure Library files
* One stop build system with Grunt or Gulp
