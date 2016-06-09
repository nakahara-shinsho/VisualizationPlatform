module.exports = function　(config) {
  config.set({
    basePath: './public/test',
    frameworks: ['jasmine',　'requirejs'],
    exclude: [],
    reporters: ['progress'],
    logLevel: config.LOG_INFO,
    colors: true,  // enable / disable colors in the output (reporters and logs)
    autoWatch: true, //let grunt-watch to deal with this things. 
    browsers: ['PhantomJS'], // Start these browsers
    port: 9876,
    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,
    files: [
      {pattern: 'test/spec/index.js', included: true},
      {pattern: 'test/spec/models/*.js', included: false},
      {pattern: 'js/**/*.js', included: false},
      {pattern: 'lib/**/*.js', included: false}
    ]
    //exclude: ['public/lib/**'],
  });
};