declare module goog {

    /**
     * @enum {string}
     */
    interface Foo {
        1: string;
        2: string;
        3: string;
    }

    /**
     * @enum {string}
     */
    interface Bar {
        '*': string;
        '=': string;
        '|': string;
    }
}
