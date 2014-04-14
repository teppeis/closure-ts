expect = require 'expect.js'
fs = require 'fs'
generator = require '../lib/generator'

describe 'Generator', ->
  files = fs.readdirSync(__dirname + '/fixtures')
  files.filter((file) -> /\.js$/.test(file)).forEach (file) ->
    it file, ->
      code = fs.readFileSync(__dirname + '/fixtures/' + file, 'utf8')
      expected = fs.readFileSync(__dirname + '/fixtures/' + file.replace(/\.js$/, '.d.ts'), 'utf8')
      expect(generator.generate(code)).to.be(expected.replace(/\n+$/, ''))
