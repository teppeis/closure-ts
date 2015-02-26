declare module goog.dom {

    /**
     * @constructor
     */
    class Foo {
        constructor();
    }
}

declare module goog.dom.Foo {

    /**
     * Inner enum
     * @enum {string}
     */
    type Bar = string;
    var Bar: {
        A: Bar;
    };

    /**
     * Inner typedef
     * @typedef {string|number}
     */
    type Typedef = string|number;

    /**
     * Inner class
     * @constructor
     */
    class Baz {
        constructor();
    }

    /**
     * Inner interface
     * @interface
     */
    interface Bao {
    }
}
