
//define global debug flag
if (typeof DEBUG === 'undefined') DEBUG = true;

requirejs.config({
  baseUrl: '../', //mainjs's parent folder
  map: {
      '*': {
        'css': 'assets/libs/css.min'
      }
  },
  paths: {
    //basic libs
    backbone    : 'assets/libs/backbone-1.1.2.min',
    text        : 'assets/libs/text',
    underscore  : 'assets/libs/underscore-min',
    jquery      : 'assets/libs/jquery-2.2.1.min',
    bootstrap   : 'assets/libs/bootstrap-3.3.4.min',
    stickit     : 'assets/libs/backbone.stickit', //replace pass variable  to template:  try to use it
    parsley     : 'assets/libs/parsley',
    undo        : 'assets/libs/Backbone.Undo',//try to use it locally
    moment      : 'assets/libs/moment.min', //Parse, validate, manipulate, and display dates in JavaScript.
    d3          : 'assets/libs/d3',
    BsDialog    : 'assets/libs/bootstrap-dialog.min',
    dialog      : 'assets/libs/dialog-plus',
    crossfilter : 'assets/libs/crossfilter',
    //compact paths
    lib         : 'assets/libs',
    model       : 'js/models',
    view        : 'js/views',
    tpl         : 'js/tpls',
    util        : 'js/utils',
    ctrl        : 'js/ctrls',
    vis         : 'VISUALIZATIONS',
    start       : 'js/main'
  },
  shim: {
    backbone: {
      deps: ['underscore', 'jquery'], exports: "Backbone" 
    },
    undo: { 
      deps: ['backbone'] 
    },
    stickit: {
      deps: ['backbone'] 
    },
    bootstrap: { 
      deps: ["jquery"]
    },
    BsDialog: {
      deps: ["bootstrap","backbone"]
    },
    dialog: {
      deps: ["jquery"]
    },
    parsley : {
      deps: ['jquery']
    },
    crossfilter: {
      deps: [], exports: "crossfilter" 
    },
    start: {
      deps: [
        'd3',
        'moment',
        'underscore',
        'undo',
        'backbone',
        'stickit',
        'bootstrap',
        'crossfilter',
        'BsDialog',
        'dialog',
        'crossfilter'
      ],
    }
  }
});

require(['start'], function(){
  window.framework = window.framework || {};
  window.framework.mediator = _.extend({}, Backbone.Events);
  window.framework.context = {};
  window.framework.undoer = new Backbone.UndoManager({maximumStackLength : 30});
  var token = $('meta[name="csrf-token"]').attr('content');
  if (token) {
    var oldSync = Backbone.sync;
    Backbone.sync = function(method, model, options) {
      if(!options) { options = {};  }
      options.headers = { 'X-CSRF-Token': token };
      return oldSync(method,model,options);
    };
    $.ajaxSetup({
      beforeSend: function(xhr, settings) {
        xhr.setRequestHeader('X-CSRF-Token', token);
      }
    });
  } //if end
});
// Initialize the application with the main application file.

