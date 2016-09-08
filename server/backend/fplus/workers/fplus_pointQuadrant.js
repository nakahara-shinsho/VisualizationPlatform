function MyClass (dbs) {

  //private members ( static variables)
  var $ = require('jquery-deferred');
   var sqlite3 = require("sqlite3").verbose();

  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log(">> [WORKER] :: fplus_pointQuadrant.js");
    console.log('request options:  ' + JSON.stringify(options)  );

    // configuration
    var family = ["fplus_setCoverageQuadrant"];

    if(options !== undefined &&
       options._context_._database_ !== undefined){
      dataPath += options._context_._database_;
    }
    var deferred = $.Deferred();
    var vt = { 'data': {}};
    // sqlite
    var db = dbs[dataPath];
    if(!db){
	db = new sqlite3.Database(dataPath+"/fplus.db");
	dbs[dataPath] = db;
    }
   // var db = new sqlite3.Database(dataPath+"/fplus.db");
    db.serialize(function(){
      var command = "select point,未検出／異常,検出／異常,未検出／正常,検出／正常 from pointQuadrant ";

      if(options._extra_where_ !== undefined){
        var condition = [];
        if(options._extra_where_.fplus_setCoverageQuadrant !== undefined &&
           options._extra_where_.fplus_setCoverageQuadrant.point_set !== undefined &&
           options._extra_where_.fplus_setCoverageQuadrant.point_set.length > 0){
          options._extra_where_.fplus_setCoverageQuadrant.point_set.forEach(function(d){
            condition.push(" point_set = \'" + d + "\'");
          });
          if(condition.length > 0){
            command += " where (" + condition.join(" or ") + ")";
          }
        }
      }
      console.log("[COMMAND] :: " + command);
      db.all(command, function(err,data){
        if(err){
          console.log(err);
          vt.data.format = "_error_";
          vt.data.filled = err;
          vt.data.family   = family;
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
          vt.data.family   = family;
          deferred.resolve(vt);
        }
      });
    });
    return deferred.promise();
  };
  return this;
}

module.exports = MyClass;
