module.exports = function (grunt) {
  'use strict';
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      libtest: {
        src: [
          'lib/**/*.js',
          'test/**/*.js',
          '!test/fixtures/**/*.js',
          '!test/all.*'
        ]
      }
    },
    mochaTest: {
      test: {
        src: [
          'test/**/*.coffee'
        ],
        options: {
          reporter: 'spec',
          colors: false
        }
      }
    },
    watch: {
      test: {
        files: [
          'Gruntfile.js',
          'lib/**/*',
          'test/**/*',
          '!test/all.*'
        ],
        tasks: ['jshint:libtest', 'mochaTest']
      }
    }
  });

  require('load-grunt-tasks')(grunt);
  grunt.registerTask('test', ['jshint', 'mochaTest']);

  // Default task
  grunt.registerTask('default', ['test']);
};
