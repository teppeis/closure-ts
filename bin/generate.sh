#!/bin/sh

BASEDIR=$(cd $(dirname $0)/..; pwd;)

find $BASEDIR/closure-library/closure/goog -type f -name '*.js'|grep -v _test|sort|
    grep -v /demos/|
    grep -v goog/iter/iter.js|
    grep -v goog/labs/promise/promise.js|
    grep -v goog/testing/async/mockcontrol.js|
    xargs $BASEDIR/bin/closurets.js
