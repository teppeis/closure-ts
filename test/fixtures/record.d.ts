declare module goog.functions {

    /**
     * @record
     */
    interface Foo {
        
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
