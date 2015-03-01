declare module goog {
    function require(name: 'goog.functions'): typeof goog.functions;
}

declare module goog.functions {

    /**
     * @param {string} s
     * @return {number}
     */
    function foo(s: string): number;
}
