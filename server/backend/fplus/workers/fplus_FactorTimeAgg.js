function MyClass (dbs) {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();

  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log(">> [WORKER] :: fplus_FactorTimeAgg.js");
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
   // var db = new sqlite3.Database(dataPath+"/fplus.db");
    db.serialize(function(){
      var command = "";
      var roundDigit = Math.pow(10, 10); // Only Set 10^N
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
          }else if(d.key == "roundDigit"){
            roundDigit = Math.pow(10,parseInt(d.value));
          }
        });
        command += "select ";
        command += "CAST( CAST(time / " + roundDigit + " AS INT) * "+  roundDigit + " + 1 AS STRING)";
        command += ' || " - " ||';
        command += "CAST( (CAST(time / " + roundDigit + " AS INT) + 1) * "+  roundDigit + " AS STRING) AS RANGE";
        command += ",sum(未検出／異常) AS 未検出／異常,sum(検出／異常) AS 検出／異常,sum(未検出／正常) AS 未検出／正常,sum(検出／正常) AS 検出／正常 from errorTable";
        if(addCondition){
          command += " where (" + condition.join(" and ")  +")";
        }
      }else{
        command += "select ";
        command += "CAST( CAST(time / " + roundDigit + " AS INT) * "+  roundDigit + " + 1 AS STRING)";
        command += ' || " - " ||';
        command += "CAST( (CAST(time / " + roundDigit + " AS INT) + 1) * "+  roundDigit + " AS STRING) AS RANGE";
        command += ",sum(未検出／異常) AS 未検出／異常,sum(検出／異常) AS 検出／異常,sum(未検出／正常) AS 未検出／正常,sum(検出／正常) AS 検出／正常 from errorTable";
      }
      command +=  " group by CAST(time / "+ roundDigit + " AS INT)";
      command +=  " order by CAST(time / "+ roundDigit + " AS INT)";
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
          var checkTime  = 0;
          var time = 0;
          for(var i=0; i < data.length; i++){
            var row = [];
            header.forEach(function(key){
              row.push(data[i][key]);
            });
            time = row[0].split(" - ")[0];
            checkTime = parseInt(beforeTime) + parseInt(roundDigit);
            if(beforeTime == -1){
              beforeTime = time;
            }else if(checkTime !== time){
              var upper = (time - beforeTime + roundDigit) / roundDigit - 1;
              var start = 0;
              var end   = 0;
              if(upper >= 1){
                for(var j=1; j < upper; j++){
                  start = parseInt(beforeTime) + parseInt(roundDigit)*j;
                  end   += parseInt(roundDigit) - 1;
                  csv.push(start + " - " + end + ",0,0,0,0");
                }
              }
              beforeTime = parseInt(row[0].split(" - ")[0]);
            }
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
 return this;
}

module.exports = MyClass;
