#!/usr/bin/env node

var cli = require('../lib/cli');
cli(process.argv, process.stdout, process.stderr, process.exit);
