#!/bin/bash

cd "$(dirname "$0")/.." || exit 1
BASEDIR=.

find $BASEDIR/closure-library.d.ts -type f -name '*.d.ts'|grep -v '/externs/'|xargs rm
find $BASEDIR/closure-library/closure/goog $BASEDIR/closure-library/third_party/closure/goog -type f -name '*.js'|sort|
    grep -v /demos/|
    grep -v /testdata/|
    grep -v '_test.js$'|
    grep -v 'tester.js$'|
    grep -v '_perf.js$'|
    diff --unchanged-line-format='' --new-line-format='' - ./bin/ignore.txt|
    xargs $BASEDIR/bin/closurets.js
cp $BASEDIR/builtin.d.ts $BASEDIR/closure-library.d.ts/externs/
$BASEDIR/bin/generate-alldts.sh
$BASEDIR/bin/check-error.sh
