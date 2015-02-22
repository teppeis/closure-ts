declare module goog.functions {

    /**
     * @param {...number} var_nums
     */
    function foo(...var_nums: number[]): void;

    /**
     * @param {...(number|string)} var_nums
     */
    function bar(...var_nums: (number|string)[]): void;
}
