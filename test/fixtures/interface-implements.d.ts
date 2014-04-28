declare module goog.functions {

    /**
     * @interface
     */
    export interface Foo {
    }

    /**
     * @interface
     */
    export interface Bar {
    }

    /**
     * @constructor
     * @implements {Foo}
     * @implements {Bar}
     */
    export class Baz implements Foo, Bar {
        constructor();
    }

    /**
     * @constructor
     * @implements {Foo}
     * @implements {Bar}
     * @extends {Baz}
     */
    export class Boo extends Baz implements Foo, Bar {
        constructor();
    }
}
