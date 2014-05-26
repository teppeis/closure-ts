declare module goog {

    /**
     * @enum {string}
     */
    interface Foo {
        FOO: string;
        BAR: string;
        BAZ: string;
    }

    /**
     * @enum {string}
     * @deprecated
     */
    interface Bar extends goog.Foo {}
}
