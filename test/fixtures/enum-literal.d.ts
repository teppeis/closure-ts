declare module goog {

    /**
     * @enum {string}
     */
    export interface Foo {
        1: string;
        2: string;
        3: string;
    }

    /**
     * @enum {string}
     */
    export interface Bar {
        '*': string;
        '=': string;
        '|': string;
    }
}
