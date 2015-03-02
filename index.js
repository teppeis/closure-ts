// Load all type definition files.
/// <reference path="./closure-library.d.ts/all.d.ts" />
function register() {
    require('./closure-library/closure/goog/bootstrap/nodejs');
}
exports.register = register;
