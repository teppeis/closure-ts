#!/bin/sh

BASEDIR=$(cd $(dirname $0)/..; pwd;)

find closure-library -type f -name '*.d.ts'|xargs rm
find $BASEDIR/closure-library -type f -name '*.js'|grep -v _test|sort|
    grep -v /demos/|
    xargs $BASEDIR/bin/closurets.js
$BASEDIR/bin/generate-alldts.sh
