declare module goog.dom {

    /**
     * @constructor
     */
    class Foo {
        constructor();
    }

    /**
     * @constructor
     * @extends {goog.dom.Foo}
     */
    class Bar extends goog.dom.Foo {
        constructor();
    }
}
