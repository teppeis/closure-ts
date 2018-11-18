#!/usr/bin/env node

'use strict';

const cli = require('../lib/cli').default;
cli(process.argv, process.stdout, process.stderr, process.exit);
