function MyClass () {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();

  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log(">> [WORKER] :: fplus_TimeCoverage.js");
    console.log('request options:  ' + JSON.stringify(options)  );
    var set = "";
    var errorData = "time,count\n0,0\n1,0";
    if(options !== undefined){
      if(options._database_ !== undefined){
        dataPath += options._database_;
      }
      if(options.__query__ !== undefined &&
         options.__query__.query !== undefined){
        options.__query__.query.forEach(function(d){
          if(d.key == "point_set"){
            set = d.value;
          }
        });
      }
    }
    var deferred = $.Deferred();
    var vt = { 'data': {}};
    if(set === ""){
      vt.data.mappable = true;
      vt.data.format   = "csv";
      vt.data.filled   = errorData;
      deferred.resolve(vt);
    }
    // sqlite
    var db = new sqlite3.Database(dataPath+"/fplus.db");
    db.serialize(function(){
      var command = "";
      command += "select time," + set + " AS count";
      command +=  " from timeCoverageSet order by time ";
      console.log("[COMMAND] :: " + command);
      db.all(command, function(err,data){
        if(err){
          console.log(err);
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
          var beforeTime = -1;
          for(var i=0; i < data.length; i++){
            var row = [];
            header.forEach(function(key){
              row.push(data[i][key]);
            });
            if(row[0] !== -1){
              if((beforeTime + 1) !== row[0]){
                if(beforeTime !== -1){
                  csv.push((beforeTime + 1) + ",0");
                }
                beforeTime = row[0];
              }
              csv.push(row.join(","));
            }
          }
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

