function MyClass () {
  
  //private members ( static variables)
  var fs = require('fs');
  var $ = require('jquery-deferred');
  
  //public member for asyn call
  this.asyn = function(options) {
    console.log('request options:  ' + JSON.stringify(options)  );
 
    var deferred = $.Deferred(),
        dfds     = [$.Deferred(), $.Deferred(), $.Deferred(), $.Deferred()],
        getarray = [],
        vt       = { 'cis_tree': {}, 'cis_mark': {}, 'scs_tree': {}, 'scs_tree_detail': {} };

    fs.readFile(__dirname + '/data/cis_tree.json', 'utf8', function(err, text){
      if(err){
        vt.cis_tree.format = 'error';
        vt.cis_tree.filled = err;
        dfds[0].reject();
      }else{
        vt.cis_tree.format = 'json';
        vt.cis_tree.filled = text;
        dfds[0].resolve();
      }
    });

    fs.readFile(__dirname + '/data/cis_marks.csv', 'utf8', function(err, text){
      if(err){
        vt.cis_mark.format = 'error';
        vt.cis_mark.filled = err;
        dfds[1].reject();
      }else{
        vt.cis_mark.format = 'csv';
        vt.cis_mark.filled = text;
        dfds[1].resolve();
      }
    });

    fs.readFile(__dirname + '/data/scs_tree.json', 'utf8', function(err, text){
      if(err){
        vt.scs_tree.format = 'error';
        vt.scs_tree.filled = err;
        dfds[2].reject();
      }else{
        vt.scs_tree.format = 'json';
        vt.scs_tree.filled = text;
        dfds[2].resolve();
      }
    });

    fs.readFile(__dirname + '/data/scs_tree_details.csv', 'utf8', function(err, text){
      if(err){
        vt.scs_tree_detail.format = 'error';
        vt.scs_tree_detail.filled = err;
        dfds[3].reject();
      }else{
        vt.scs_tree_detail.format = 'csv';
        vt.scs_tree_detail.filled = text;
        dfds[3].resolve();
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