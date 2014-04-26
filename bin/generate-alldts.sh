#!/bin/sh

BASEDIR=$(cd $(dirname $0)/..; pwd;)
CLOSURE_DIR=$BASEDIR/closure-library

find $CLOSURE_DIR -type f -name '*.d.ts'|grep -v all.d.ts|sort|
    sed -e 's/.*\/closure-library\//\/\/\/ <reference path="/g' -e 's/$/" \/>/g' > $CLOSURE_DIR/all.d.ts
