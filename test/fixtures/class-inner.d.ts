declare module goog.dom {

    /**
     * @constructor
     */
    export class Foo {
        constructor();
    }
}

declare module goog.dom.Foo {

    /**
     * Inner enum
     * @enum {string}
     */
    export interface Bar {
        A: string;
    }

    /**
     * Inner typedef
     * @typedef {string|number}
     */
    export interface Typedef {
    }

    /**
     * Inner class
     * @constructor
     */
    export class Baz {
        constructor();
    }

    /**
     * Inner interface
     * @interface
     */
    export interface Bao {
    }
}
