declare module goog.string$ {

    /**
     * @constructor
     */
    class Bar {
        constructor();
    }

    /**
     * @constructor
     * @extends {goog.string.Bar}
     */
    class Baz extends goog.string$.Bar {
        constructor();
    }

    /**
     * @param {goog.string.Bar} bar
     * @param {function(goog.string.Bar): goog.string.Bar} f
     * @return {goog.string.Bar}
     */
    function foo(bar: goog.string$.Bar, f: (arg0: goog.string$.Bar) => goog.string$.Bar): goog.string$.Bar;
}
