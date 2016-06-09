function MyClass () {
  
  //private members ( static variables)
  var fs = require('fs');
  var $ = require('jquery-deferred');
  
  //public member for asyn call
  this.asyn = function(options) {
    console.log('request options:  ' + JSON.stringify(options)  );
 
    var deferred = $.Deferred(),
        dfds     = [$.Deferred(), $.Deferred(), $.Deferred()],
        getarray = [],
        vt       = { 'tree': {}, 'nodes': {}, 'links': {} };

    fs.readFile(__dirname + '/data/fc_additional_tree.json', 'utf8', function(err, text){
      if(err){
        vt.tree.format = 'error';
        vt.tree.filled = err;
        dfds[0].reject();
      }else{
        vt.tree.format = 'json';
        vt.tree.filled = text;
        dfds[0].resolve();
      }
    });

    fs.readFile(__dirname + '/data/fc_nodes.csv', 'utf8', function(err, text){
      if(err){
        vt.nodes.format = 'error';
        vt.nodes.filled = err;
        dfds[1].reject();
      }else{
        vt.nodes.format = 'csv';
        vt.nodes.filled = text;
        dfds[1].resolve();
      }
    });

    fs.readFile(__dirname + '/data/fc_links.csv', 'utf8', function(err, text){
      if(err){
        vt.links.format = 'error';
        vt.links.filled = err;
        dfds[2].reject();
      }else{
        vt.links.format = 'csv';
        vt.links.filled = text;
        dfds[2].resolve();
      }
    });

    for (var i = 0; i < dfds.length; i++) {
        getarray.push(dfds[i].promise());
    }

    $.when.apply($, getarray).done(function (err) {
      if (err) {
        deferred.reject(vt);
      }
      else {
        deferred.resolve(vt); 
      }
    });

    return deferred.promise();
  };
}

module.exports = new MyClass();