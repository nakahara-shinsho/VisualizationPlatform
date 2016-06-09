function MyClass () {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  //var hl    = require("highlight").Highlight;
  var fs   =  require("fs");
  //public member for asyn call
  this.asyn = function(options,dataPath) {
    console.log('request options:  ' + JSON.stringify(options)  );

    if(options !== undefined &&
       options._database_ !== undefined){
      dataPath += options._database_;
    }
    var deferred = $.Deferred();
    var vt = { 'data': {}};
    var filename;
    if(options.__query__){
      if(options.__query__.query[0].key === "ファイル名"){
        filename = options.__query__.query[0].value;
      }
    }
    console.log("================");
    console.log("================");
    console.log("================");
    console.log("================");
    console.log("================");
    console.log(filename);
    if(filename === undefined){
      vt.data.mappable = false;
      vt.data.format = 'text';
      vt.data.filled = "";
      deferred.resolve(vt);
      return deferred.promise();
    }
    fs.readFile(dataPath +'/fplus_source/'+filename, 'utf8', function(err, text){
      if(err){
        vt.data.format = '_error_';
        vt.data.filled = err;
        deferred.reject(vt);
      }else{
        vt.data.mappable = false;
        vt.data.format = 'text';
        vt.data.filled = text;
        deferred.resolve(vt);
      }
    });
    return deferred.promise();
  };
}

module.exports = new MyClass();
