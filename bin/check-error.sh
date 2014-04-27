#!/bin/sh

BASEDIR=$(cd $(dirname $0)/..; pwd;)

tsc $BASEDIR/test/all.ts 2>&1 | sed -e 's/\/.*\/closure-ts\///g' |tee $BASEDIR/error.log
