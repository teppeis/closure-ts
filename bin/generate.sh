#!/bin/sh

BASEDIR=$(cd $(dirname $0)/..; pwd;)

find $BASEDIR/closure-library.d.ts -type f -name '*.d.ts'|grep -v '/externs/'|xargs rm
find $BASEDIR/closure-library -type f -name '*.js'|grep -v _test|sort|
    grep -v /demos/|
    grep -v /goog/result/|
    grep -v /goog/testing/|
    grep -v /goog/net/mockiframeio.js|
    grep -v tester.js|
    xargs $BASEDIR/bin/closurets.js
cp $BASEDIR/builtin.d.ts $BASEDIR/closure-library.d.ts/externs/
$BASEDIR/bin/generate-alldts.sh
$BASEDIR/bin/check-error.sh
