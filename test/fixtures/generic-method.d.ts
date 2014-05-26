declare module goog.dom {

    /**
     * @constructor
     */
    class Foo {
        constructor();
        
        /**
         * @param {T} t
         * @template T
         */
        foo<T>(t: T): void;
    }
}
