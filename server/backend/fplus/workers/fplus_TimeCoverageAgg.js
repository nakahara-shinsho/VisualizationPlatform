function MyClass () {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();

  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log(">> [WORKER] :: fplus_TimeCoverageAgg.js");
    console.log('request options:  ' + JSON.stringify(options)  );
    var set = "";
    var errorData = "range,count\n0-0,0";
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
      var roundDigit = Math.pow(10, 10); // Only Set 10^N
      command += "select ";
      command += "CAST( CAST(time / " + roundDigit + " AS INT) * "+  roundDigit + " + 1 AS STRING)";
      command += ' || " - " ||';
      command += "CAST( (CAST(time / " + roundDigit + " AS INT) + 1) * "+  roundDigit + " AS STRING) AS range";
      command +=  " ,sum(" + set + ") AS count ";
      command +=  " from timeCoverageSet ";
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
                  csv.push(start + " - " + end + ",0");
                }
              }
              beforeTime = parseInt(row[0].split(" - ")[0]);
            }
            csv.push(row.join(","));
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

