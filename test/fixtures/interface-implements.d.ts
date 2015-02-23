declare module goog.functions {

    /**
     * @interface
     */
    interface Foo {
    }

    /**
     * @interface
     */
    interface Bar {
    }

    /**
     * @constructor
     * @implements {goog.functions.Foo}
     * @implements {goog.functions.Bar}
     */
    class Baz {
        constructor();
    }
}
