/**
 * @interface
 */
goog.functions.Foo = function() {};

/**
 * @interface
 */
goog.functions.Bar = function() {};

/**
 * @constructor
 * @implements {Foo}
 * @implements {Bar}
 */
goog.functions.Baz = function() {};

/**
 * @constructor
 * @implements {Foo}
 * @implements {Bar}
 * @extends {Baz}
 */
goog.functions.Boo = function() {};
