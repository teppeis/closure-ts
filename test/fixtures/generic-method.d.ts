declare module goog.dom {

    /**
     * @constructor
     */
    export class Foo {
        constructor();
        
        /**
         * @param {T} t
         * @template T
         */
        foo<T>(t: T): void;
    }
}
