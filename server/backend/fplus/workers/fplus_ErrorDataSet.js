function MyClass (db) {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require('sqlite3').verbose();
  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log('request options:  ' + JSON.stringify(options)  );
    if(options !== undefined &&
       options._context_ !== undefined &&
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
    db.serialize(function(){
      var command = "select point_set,sum(未検出／異常) AS 未検出／異常,sum(検出／異常) AS 検出／異常,sum(未検出／正常) AS 未検出／正常,sum(検出／正常) AS 検出／正常 from errorTable ";
      if(options.__query__ !== undefined &&
         options.__query__.query !== undefined){
        var condition = [];
        options.__query__.query.forEach(function(d){
          condition.push(d.key + " == " + parseInt(d.value));
        });
        command += "where (" + condition.join(" AND ") + ")";
      }
      command += " group by point_set";
      console.log("[COMMAND] :: " + command);
      db.all(command, function(err, data){
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

module.exports = MyClass;
