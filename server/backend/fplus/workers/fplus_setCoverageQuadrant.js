function MyClass (dbs) {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();

  this.vts = function(wk_name){
    return [wk_name];
  };
  
  //public member for asyn call
  this.asyn = function(options, dataPath) {
    //console.log('request options:  ' + JSON.stringify(options)  );

    if(options !== undefined &&
       options._context_._database_ !== undefined){
      dataPath += options._context_._database_;
    }
    var deferred = $.Deferred();
    var vt = { 'data': {}};
    // sqlite
    var db = dbs[dataPath];
    if(!db) {
          db= new sqlite3.Database(dataPath+"/fplus.db");
          dbs[dataPath]=db;
    } 
   //var db = new sqlite3.Database(dataPath+"/fplus.db");
    db.serialize(function(){
      var command = "select point_set,未検出／異常カバレッジ AS 未検出／異常,検出／異常カバレッジ AS 検出／異常,未検出／正常カバレッジ AS 未検出／正常,検出／正常カバレッジ AS 検出／正常 from setCoverage ;";
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
  }; return this;
}

module.exports =  MyClass;
