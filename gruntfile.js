
module.exports = function (grunt) {

  grunt.initConfig({
    client:   'client/',
    jsDir:    'client/js/',
    ejsDir:   'client/ejs/',
    cssDir:   'client/csses/',
    tplDir:   'client/hbs/',
    jsServer: 'server/',
    backupServer: 'server-release/',
    backupClient: 'client-release/',
    behaviorTest : 'client/test/behavior',
    pkg: grunt.file.readJSON('package.json'),
    jsdoc : {
        dist : {
            src: ['client/js/**/*.js'],
            options: {
                destination: 'docs/client'
            }
        }
    },
    nodemon: {
      dev: {
        script: '<%=jsServer%>start.js',
        options: {
          nodeArgs: ['--debug=2000'], //debug-brk
          env: {
            PORT: '8001'
          },
          watch: [
            'gruntfile.js',
            '<%=jsServer%>**/*.js'
          ],
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });
          }
        }
      },
      prod: {
        script: '<%=backupServer%>start.js',
        options: {
          nodeArgs: ['--debug=2000'], //debug-brk
          env: {
            PORT: '8001'
          },
          watch: [
            'gruntfile.js',
            '<%=backupServer%>**/*.js'
          ],
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });
          }
        }
      }
    },
    'node-inspector': {
      dev: {
        options: {
          'web-port': 2001,
          'web-host': 'localhost',
          'debug-port': 2000,
          'save-live-edit': true,
          'stack-trace-limit': 4,
          'hidden': ['node_modules']
        }
      }
    },
    // For Behavior Testing
    jasmine_nodejs: {
      // task specific (default) options
      options: {
        specNameSuffix: "spec.js", // also accepts an array
        helperNameSuffix: "helper.js",
        useHelpers: false,
        stopOnFailure: false,
        // configure one or more built-in reporters
        reporters: {
          console: {
            colors: true,
            cleanStack: 1,       // (0|false)|(1|true)|2|3
            verbosity: 3,        // (0|false)|1|2|(3|true)
            listStyle: "indent", // "flat"|"indent"
            activity: false
          },
          junit: {
            savePath: "<%=behaviorTest%>/reports",
            filePrefix: "junit-report",
            consolidate: true,
            useDotNotation: true
          }
        },
        // add custom Jasmine reporter(s)
        customReporters: []
      },
      your_target: {
        // target specific options
        options: {
          useHelpers: true
        },
        // spec files
        specs: ["<%=behaviorTest%>/spec/*"],
        helpers: []
      }
    },

    requirejs: {
      prod: {
        options: {
          mainConfigFile: './client/js/config.js',
          dir: './client-release/',
          findNestedDependencies: true,
          name: 'js/config',
          wrapShim: true,
          optimizeCss: 'none' //'standard'
        }
      }
    },
    stylus: {
      options: {
        compress: false
      },
      compile: {
        files: {
          '<%= cssDir %>/common.css': ['<%= cssDir %>/styl/*.styl']
        }
      }
    },
    exec: {
      compile_tpl: {
        command: 'ejs-amd -f <%=ejsDir%> -t <%=jsDir%>/tpls',
        stdout: true,
        stderr: true
      }
    },
    uglify: {
         client: {
            files: [{
              src: './client/js/models/*.js',  // source files mask
              dest: './<%=backupClient%>/js/models/',    // destination folder
              expand: true,    // allow dynamic building
              flatten: true   // remove all unnecessary nesting
            }]
         },
         server:{
            files: [{
              src: './server/stream/*.js',  // source files mask
              dest: './<%=backupServer%>/stream/',    // destination folder
              expand: true,    // allow dynamic building
              flatten: true   // remove all unnecessary nesting
            },
            {
              src: './server/router/*.js',  // source files mask
              dest: './<%=backupServer%>/router/',    // destination folder
              expand: true,    // allow dynamic building
              flatten: true   // remove all unnecessary nesting
          }]
        }
    },
    copy: {
      server: {
        files: [
          {expand: true, cwd: './server/', src: ['backend/**', 'views/**', 'db/**', '*.js'], dest: './<%=backupServer%>/'}
        ]
      },
      client: {
        files: [
          {expand: true, cwd: './client/', src: ['js/config.js', 'js/views/**','js/utils/**','test/**','VISUALIZATIONS/**'], dest: './<%=backupClient%>/'}
        ]
      }
    },
    watch: {
      client_reload: {
        files: ['.rebooted'],
        options: {
          livereload: true
        }
      },
      tpl_files: {
        files: ['<%=ejsDir%>/*.ejs'],
        tasks: ['exec:compile_tpl' ]
      },
      jsclient: {
        files: ['<%=jsDir%>/**/*.js'],
        tasks: ['requirejs:prod'/*, 'requirejs:css'*/]
      },
      jsserver: {
        files: ['<%=jsServer%>/**/*.js'],
        tasks: ['uglify:server']
      },
      stylus: {
        files: ['<%= cssDir %>/styl/*.styl'],
        tasks: ['stylus'/*,'requirejs:css'*/]
      },
      handlebars: {
        files: ['<= tplDir %>/*.hbs'],
        tasks: ['handlebars']
      }
    },
    concurrent: {
      client: [ 
        'watch:stylus', //build from *styl to css  
        'watch:tpl_files', //build from template file to js classes file --have not been used
        'watch:jsclient'  //compile release file 
      ],
      serverdevelopment: [
        'nodemon:dev', //start server and watch for restarting
        'node-inspector' //server debug in browser
      ],
      serverproduction: [
        'nodemon:prod', //start server and watch for restarting
        'node-inspector' //server debug in browser
      ],
      servertest: [
        'nodemon:dev', //start server and watch for restarting
        'node-inspector' //server debug in browser
      ],
      all: ['client', 'server'],
      options: {
        logConcurrentOutput: true
      }
    }
  });

  // on watch events configure jshint:all to only run on changed file -- to be tested
  grunt.event.on('watch', function (action, filepath, target) {
    grunt.config('jshint.' + target + '.files', filepath);
  });
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.registerTask('exit', 'Just exits.', function () {
    process.exit(0);
  });
  var target = grunt.option('target')  || 'development';
  grunt.registerTask('default', 'vispla', ['concurrent:all']);
  grunt.registerTask('server', 'vispla:server', ['concurrent:server'+target]);
  grunt.registerTask('devcss', 'watch and build css from styl', ['watch:stylus']);
  grunt.registerTask('client', 'vispla:client', ['concurrent:client']);
  grunt.registerTask('compile-server', 'vispla server build', [ 'uglify:server', 'copy:server']);
  grunt.registerTask('docoment', 'vispla:doc', ['jsdoc:dist']);
  grunt.registerTask('compile-client', 'vispla client build', [ 'requirejs:prod',  'copy:client']);
  grunt.registerTask('build', 'build all', [ 'requirejs:prod',  'copy:client','uglify:server', 'copy:server']);

  grunt.registerTask('test', ['jasmine_nodejs']);
};
