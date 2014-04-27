/**
 * @constructor
 */
goog.string.Bar = function() {};

/**
 * @constructor
 * @extends {goog.string.Bar}
 */
goog.string.Baz = function() {};

/**
 * @param {goog.string.Bar} bar
 * @param {function(goog.string.Bar): goog.string.Bar} f
 * @return {goog.string.Bar}
 */
goog.string.foo = function(bar, f) {};
