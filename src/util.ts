export function renameReservedModuleName(name: string): string {
  return name.replace(/^goog\.string(?=$|\.)/, 'goog.string$');
}

/**
 * `goog.foo.Bar` => `goog_foo_Bar`
 */
export function renameToId(name: string): string {
  return name.replace(/\./g, '_');
}
