declare module goog {

    /**
     * @enum {string}
     */
    type Foo = string;
    var Foo: {
        1: Foo;
        2: Foo;
        3: Foo;
    };

    /**
     * @enum {string}
     */
    type Bar = string;
    var Bar: {
        '*': Bar;
        '=': Bar;
        '|': Bar;
    };
}
