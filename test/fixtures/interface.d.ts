declare module goog.functions {

    /**
     * @interface
     */
    export interface Foo {
        
        /**
         * @type {number}
         */
        foo: number;
        
        /**
         * @param {number} num
         * @return {string}
         */
        bar(num: number): string;
        
        /**
         * No @param and @return.
         */
        baz(): void;
    }
}
