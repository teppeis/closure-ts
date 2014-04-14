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
          'test/**/*'
        ],
        tasks: ['jshint:libtest', 'mochaTest']
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  // Default task
  grunt.registerTask('default', ['jshint', 'mochaTest']);
};
