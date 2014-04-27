#!/bin/sh

BASEDIR=$(cd $(dirname $0)/..; pwd;)

find closure-library -type f -name '*.d.ts'|grep -v '/externs/'|xargs rm
find $BASEDIR/closure-library -type f -name '*.js'|grep -v _test|sort|
    grep -v /demos/|
    xargs $BASEDIR/bin/closurets.js
$BASEDIR/bin/generate-alldts.sh
tsc $BASEDIR/test/all.ts 2>&1 | sed -e 's/\/.*\/closure-ts\///g' > $BASEDIR/error.log
ack 'TS\d+' $BASEDIR/error.log -o|sort|uniq -c|sort -r > $BASEDIR/errorcode.log
ack '^closure[^\(]*' $BASEDIR/error.log -o|sort|uniq -c|sort -r > $BASEDIR/ranking.log
