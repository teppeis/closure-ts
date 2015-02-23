declare module goog.functions {

    /**
     * @interface
     */
    interface Foo {
    }

    /**
     * @constructor
     */
    class Bar {
        constructor();
    }

    /**
     * @constructor
     * @extends {goog.functions.Bar}
     * @implements {goog.functions.Foo}
     */
    class Baz extends goog.functions.Bar {
        constructor();
    }
}
