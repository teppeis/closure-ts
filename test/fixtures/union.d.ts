declare module goog.functions {

    /**
     * @param {number|string} arg
     */
    function foo(arg: number|string): void;

    /**
     * @param {Array<number|string>} arg
     * @return {Array<boolean|null>} arg
     */
    function bar(arg: Array<number|string>): Array<boolean|void>;

    /**
     * @param {number|function(string, number): boolean} arg
     */
    function baz(arg: number|((arg0: string, arg1: number) => boolean)): void;

    /**
     * @param {number|?function(string, number): boolean} arg
     */
    function nullable(arg: number|((arg0: string, arg1: number) => boolean)): void;
}
