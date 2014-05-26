declare module goog.functions {

    /**
     * @interface
     */
    interface Foo {
    }
}

declare module goog.functions.Foo {

    /**
     * @type {number}
     */
    var foo: number;

    /**
     * @param {number} num
     * @return {string}
     */
    function bar(num: number): string;
}
