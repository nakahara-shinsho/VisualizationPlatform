function MyClass () {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  //var hl    = require("highlight").Highlight;
  var fs   =  require("fs");
  var glob = require("glob");

  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options,dataPath) {
    console.log(">>****************** [WORKER] :: fplus_SourceCodeView.js");
    console.log('request options:  ' + JSON.stringify(options)  );
    // Configuration 
    var family = ["fplus_factorFile","fplus_factorLine"];
    var scrollTargetKey = "line";

    if(options !== undefined &&
       options._context_ !== undefined &&
       options._context_._database_ !== undefined){
      dataPath += options._context_._database_;
    }
    var deferred = $.Deferred();
    var vt = { 'data': {}};
    var filename;
    var scrollTarget = 0;
    if(options._extra_where_ !== undefined){
      if(options._extra_where_.fplus_factorFile !== undefined ){
        if(options._extra_where_.fplus_factorFile.file !== undefined &&
           options._extra_where_.fplus_factorFile.file !== ""){
          filename = options._extra_where_.fplus_factorFile.file[0];
        }
      }
      if(options._extra_where_.fplus_factorLine !== undefined ){
        if(options._extra_where_.fplus_factorLine[scrollTargetKey] !== undefined &&
           options._extra_where_.fplus_factorLine[scrollTargetKey] !== ""){
          scrollTarget = options._extra_where_.fplus_factorLine[scrollTargetKey];
        }
      }
    }
    if(filename === undefined || filename === "Unknown"){
      vt.data.mappable = false;
      vt.data.format = 'text';
      vt.data.filled = "";
      vt.data.family = ["fplus_factorFile"];
      deferred.resolve(vt);
      return deferred.promise();
    }
    glob((dataPath+"/**/"+filename), function (err, files) {
      if(err) {
        console.log(err);
      }
      files = files.filter(function(d){
        return d.indexOf("source") !== -1;
      });
      if(files.length == 0){
        console.log("[WARNING]:: Target File is not found " + filename);
        vt.data.mappable = false;
        vt.data.format = 'text';
        vt.data.filled = "";
        vt.data.family = family;
        deferred.resolve(vt);
      }else{
        if(files.length > 1){
          console.log("[WARNING]:: Target File is not one.");
          console.log("[WARNING]:: " + files);
        }
        filename = files[0];
        fs.readFile(filename, 'utf8', function(err, text){
          if(err){
            vt.data.format = '_error_';
            vt.data.filled = err;
            deferred.reject(vt);
          }else{
            vt.data.mappable = false;
            vt.data.format = 'text';
            vt.data.filled = "/**__SCROLL_TARGET__" + scrollTarget +"__**/\n"+ text;
            vt.data.family = family;
            deferred.resolve(vt);
          }
        });
      }
    });
    return deferred.promise();
  };
}

module.exports = new MyClass();
