goog.provide('goog.dom');

/**
 * @constructor
 */
goog.dom.Foo = function() {};

/**
 * @constructor
 * @extends {goog.dom.Foo}
 */
goog.dom.Bar = function() {};
goog.inherits(goog.dom.Bar, goog.dom.Foo);
