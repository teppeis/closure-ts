export function renameReservedModuleName(name: string): string {
  return name.replace(/^goog\.string(?=$|\.)/, 'goog.string$');
}
