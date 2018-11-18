#!/bin/bash

BASEDIR=$(cd "$(dirname "$0")/.."; pwd;) || exit 1

npx typescript@3.1 --noEmit --lib DOM,ES2018,DOM.Iterable "$BASEDIR/test/all.ts" 2>&1 | \
    sed -e 's/\/.*\/closure-ts\///g' | \
    tee "$BASEDIR/misc/error.log"
