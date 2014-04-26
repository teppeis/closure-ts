goog.provide('goog.dom');

/**
 * @constructor
 */
goog.dom.Foo = function() {};

/**
 * @type {*}
 */
goog.dom.Foo.prototype.foo1 = null;

/**
 * @type {*}
 */
goog.dom.Foo.prototype.foo2 = null;

/**
 * @type {*}
 */
goog.dom.Foo.prototype.foo3 = null;


/**
 * @type {*}
 */
goog.dom.Foo.prototype.foo4 = null;

/**
 * @constructor
 * @extends {goog.dom.Foo}
 */
goog.dom.Bar = function() {};
goog.inherits(goog.dom.Bar, goog.dom.Foo);

/**
 * @override
 */
goog.dom.Bar.prototype.foo1 = '';

/**
 * @type {string}
 * @override
 */
goog.dom.Bar.prototype.foo2;

/**
 * Description.
 * @override
 */
goog.dom.Bar.prototype.foo3;

/**
 * Description.
 * @override
 */
goog.dom.Bar.prototype.foo4 = '';
