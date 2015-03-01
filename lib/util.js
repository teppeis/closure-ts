'use strict';

function renameReservedModuleName(name) {
  return name.replace(/^goog\.string(?=$|\.)/, 'goog.string$');
}

module.exports = {
  renameReservedModuleName: renameReservedModuleName
};
