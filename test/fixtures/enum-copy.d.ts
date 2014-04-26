declare module goog {

    /**
     * @enum {string}
     */
    export interface Foo {
        FOO: string;
        BAR: string;
        BAZ: string;
    }

    /**
     * @enum {string}
     * @deprecated
     */
    export interface Bar extends goog.Foo {}
}
