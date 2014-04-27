declare module goog.functions {

    /**
     * @interface
     */
    export interface Foo {
    }
}

declare module goog.functions.Foo {

    /**
     * @type {number}
     */
    export var foo: number;

    /**
     * @param {number} num
     * @return {string}
     */
    export function bar(num: number): string;
}
