
require.config({
  baseUrl: "../",
  urlArgs: 'cb=' + Math.random(),
  paths: {
    jquery: 'lib/jquery-2.1.1.min',
    underscore: 'lib/underscore-min',
    backbone: 'lib/backbone-min',
    spec: 'test/spec',
    models: 'js/models'
  },
  shim: {
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    }
  }
});

require(['jquery', 'spec/index'], function ($, index) {
  var jasmineEnv = jasmine.getEnv(),
    htmlReporter = new jasmine.HtmlReporter();

  jasmineEnv.addReporter(htmlReporter);

  jasmineEnv.specFilter = function (spec) {
    return htmlReporter.specFilter(spec);
  };

  $(function () {
    require(index.specs, function () {
      jasmineEnv.execute();
    });
  });
});