expect = require 'expect.js'
fs = require 'fs'
diff = require 'diff'
generator = require '../lib/generator'

describe 'Generator', ->
  files = fs.readdirSync(__dirname + '/fixtures')
  files.filter((file) -> /\.js$/.test(file)).forEach (file) ->
    it file, ->
      code = fs.readFileSync(__dirname + '/fixtures/' + file, 'utf8')
      actual = generator.generate(code)
      expected = fs.readFileSync(__dirname + '/fixtures/' + file.replace(/\.js$/, '.d.ts'), 'utf8')
      if (actual != expected)
        diff.diffChars(expected, actual).forEach (part) ->
          value = part.value
          value = if part.added then '[+' + value + ']' else if part.removed then '[-' + value + ']' else value
          process.stderr.write(value)

        throw new Error('Different result')
