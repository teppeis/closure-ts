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
     * @interface
     * @extends {Foo}
     * @extends {Bar}
     */
    export interface Baz extends Foo, Bar {
    }
}
