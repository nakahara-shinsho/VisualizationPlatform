function MyClass () {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();

  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log(">> [WORKER] :: fplus_FactorCYCLE.js");
    console.log('request options:  ' + JSON.stringify(options)  );

    if(options !== undefined &&
       options._database_ !== undefined){
      dataPath += options._database_;
    }

    var deferred = $.Deferred();
    var vt = { 'data': {}};
    // sqlite
    var db = new sqlite3.Database(dataPath+"/fplus.db");
    db.serialize(function(){
      var command = "select time,sum(未検出／異常) AS 未検出／異常,sum(検出／異常) AS 検出／異常,sum(未検出／正常) AS 未検出／正常,sum(検出／正常) AS 検出／正常 from errorTable";
      if(options.__query__ !== undefined){
        var condition = [];
        var addCondition = false;
        options.__query__.query.forEach(function(d){
          if(d.key == "factor"){
            addCondition = true;
            condition.push(d.key + " == \'" + d.value + "\'");
          }else if(d.value == "exist"){
            condition.push(d.key + " > 0");
          }else if(d.key == "file"){
            addCondition = true;
            condition.push(d.key + " == \'" + d.value + "\'");
          }else if(d.key == "function"){
            addCondition = true;
            condition.push(d.key + " == \'" + d.value + "\'");
          }else if(d.key == "line"){
            addCondition = true;
            condition.push(d.key + " == \'" + d.value + "\'");
          }else if(d.key == "programcounter"){
            addCondition = true;
            condition.push(d.key + " == \'" + d.value + "\'");
          }
        });
        if(addCondition){
          command += " where (" + condition.join(" and ")  +")";
        }
      }
      command += " group by time";
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
