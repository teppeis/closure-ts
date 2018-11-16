#!/bin/sh

BASEDIR=$(cd $(dirname $0)/..; pwd;)

npx typescript@1.4 $BASEDIR/test/all.ts 2>&1 | sed -e 's/\/.*\/closure-ts\///g' | tee $BASEDIR/error.log
