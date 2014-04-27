declare module goog.functions {

    /**
     * @interface
     */
    export interface Foo {
        
        /**
         * @type {number}
         */
        bar: number;
        
        /**
         * @param {number} num
         * @return {string}
         */
        foo(num: number): string;
    }
}
