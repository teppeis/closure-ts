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
     * @interface
     * @extends {Foo}
     * @extends {Bar}
     */
    interface Baz extends Foo, Bar {
    }
}
