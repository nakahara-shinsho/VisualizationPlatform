function MyClass () {

  //private members ( static variables)
  var fs     = require('fs');
  var path   = require('path');
  var $      = require('jquery-deferred');
  const exec = require('child_process').execSync;
  //public member for asyn call
  this.vts = function(wk_name) {
      return [wk_name];
  };

  this.asyn = function(options, dataPath) {
    console.log('request options:  ' + JSON.stringify(options)  );
    var deferred = $.Deferred();
    var vt = {};
    var result = exec("mysql -ufplus -ppolyspector < \""+ __dirname +"/get_datalist.sql\"");
    var StringDecoder = require('string_decoder').StringDecoder;
    var decoder = new StringDecoder('UTF-8');
    var list =  decoder.write(result);
    var data    = {list:[]};
    var headers = [];
    list.split("\n").forEach(function(row,i){
      if(i == 0){
        headers = row.trim().split("\t");
      }else{
        var tmp = {};
        if(row.length !== 0){
          row.trim().split("\t").forEach(function(val,idx){
            tmp[headers[idx]] = val;
          });
          data.list.push(tmp);
        }
      }
    });
    vt.format = 'json';
    vt.filled = data;
    deferred.resolve(vt);
    return deferred.promise();
  };
}

module.exports = new MyClass();
