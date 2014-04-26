#!/bin/sh

BASEDIR=$(cd $(dirname $0)/..; pwd;)

find $BASEDIR/closure-library/closure/goog -type f -name '*.js'|grep -v _test|sort|
    grep -v /demos/|
    grep -v goog/datasource/jsondatasource.js|
    grep -v goog/iter/iter.js|
    grep -v goog/labs/promise/promise.js|
    grep -v goog/reflect/reflect.js|
    grep -v goog/soy/renderer.js|
    grep -v goog/soy/soy.js|
    grep -v goog/string/stringformat.js|
    grep -v goog/structs/stringset.js|
    grep -v goog/testing/async/mockcontrol.js|
    grep -v goog/ui/containerrenderer.js|
    grep -v goog/ui/imagelessbuttonrenderer.js|
    grep -v goog/ui/paletterenderer.js|
    grep -v goog/ui/style/app/buttonrenderer.js|
    xargs $BASEDIR/bin/closurets.js
