#!/bin/sh

BASEDIR=$(cd $(dirname $0)/..; pwd;)

tsc $BASEDIR/test/all.ts 2>&1 | sed -e 's/\/.*\/closure-ts\///g' > $BASEDIR/error.log
ack 'TS\d+' $BASEDIR/error.log -o|sort|uniq -c|sort -r > $BASEDIR/errorcode.log
ack '^closure[^\(]*' $BASEDIR/error.log -o|sort|uniq -c|sort -r > $BASEDIR/ranking.log
