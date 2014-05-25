#!/bin/sh

BASEDIR=$(cd $(dirname $0)/..; pwd;)
DEFINITION_DIR=$BASEDIR/closure-library.d.ts

find $DEFINITION_DIR -type f -name '*.d.ts'|grep -v all.d.ts|sort| \
    sed -e 's/.*\/closure-library.d.ts\//\/\/\/ <reference path="/g' -e 's/$/" \/>/g' > $DEFINITION_DIR/all.d.ts
