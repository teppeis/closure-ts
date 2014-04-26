goog.provide('goog');

/**
 * @enum {string}
 */
goog.Foo = {
  FOO: 'foo',
  BAR: 'bar',
  BAZ: 'baz'
};

/**
 * @enum {string}
 * @deprecated
 */
goog.Bar = goog.Foo;
