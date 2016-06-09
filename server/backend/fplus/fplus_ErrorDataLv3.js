function MyClass () {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    //console.log('request options:  ' + JSON.stringify(options)  );

    if(options !== undefined &&
       options._database_ !== undefined){
      dataPath += options._database_;
    }

    var deferred = $.Deferred();
    var vt = { 'data': {}};
    // sqlite
    var db = new sqlite3.Database(dataPath+"/fplus.db");
    db.serialize(function(){
      var command = "select 要因第3階層,未検出／異常,検出／異常,未検出／正常,検出／正常  from errorData where 要因第3階層 != ''";
      if(options.__query__ !== undefined){
        var condition = [];
        options.__query__.query.forEach(function(d){
          condition.push(d.key + " == \'" + d.value + "\'");
        });
        command += " and (" + condition.join(" or ") + ")";
      }
      console.log("[COMMAND] :: " + command);
      db.all(command, function(err,data){
        if(err){
          vt.data.format = "_error_";
          vt.data.filled = err;
          deferred.reject(vt);
        }else{
          var csv = [];
          var header = [];
          for(var k in data[0]){
            header.push(k);
          }
          csv.push(header.join(","));
          for(var i=0; i < data.length; i++){
            var row = [];
            header.forEach(function(key){
              row.push(data[i][key]);
            });
            csv.push(row.join(","));
          }
          vt.data.mappable = true;
          vt.data.format   = "csv";
          vt.data.filled   = csv.join("\n").concat();
          deferred.resolve(vt);
        }
      });
    });
    return deferred.promise();
  };
}

module.exports = new MyClass();
