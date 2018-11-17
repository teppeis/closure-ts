#!/bin/bash

cd "$(dirname "$0")/.." || exit 1
BASEDIR=.

find $BASEDIR/closure-library.d.ts -type f -name '*.d.ts'|grep -v '/externs/'|xargs rm
find $BASEDIR/closure-library -type f -name '*.js'|sort|
    grep -v /demos/|
    grep -v /testdata|
    grep -v /testing/|
    grep -v '_test.js$'|
    grep -v 'tester.js$'|
    grep -v '_perf.js$'|
    grep -v /goog/result/|
    grep -v /goog/net/mockiframeio.js|
    grep -v /goog/proto2/test.pb.js|
    diff --unchanged-line-format='' --new-line-format='' - ./bin/ignore.txt|
    xargs $BASEDIR/bin/closurets.js
cp $BASEDIR/builtin.d.ts $BASEDIR/closure-library.d.ts/externs/
$BASEDIR/bin/generate-alldts.sh
$BASEDIR/bin/check-error.sh
