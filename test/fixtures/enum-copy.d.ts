declare module goog {

    /**
     * @enum {string}
     */
    type Foo = string;
    var Foo: {
        FOO: Foo;
        BAR: Foo;
        BAZ: Foo;
    };

    /**
     * @enum {string}
     * @deprecated
     */
    export import Bar = goog.Foo;
}
