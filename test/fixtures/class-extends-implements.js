/**
 * @interface
 */
goog.functions.Foo = function() {};

/**
 * @constructor
 */
goog.functions.Bar = function() {};

/**
 * @constructor
 * @extends {goog.functions.Bar}
 * @implements {goog.functions.Foo}
 */
goog.functions.Baz = function() {};
goog.inherits(goog.functions.Baz, goog.functions.Foo);
