function MyClass () {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();

  //public member for asyn call
  this.asyn = function(options,dataPath) {
    console.log('request options:  ' + JSON.stringify(options)  );
    if(options !== undefined &&
       options._database_ !== undefined){
      dataPath += options._database_;
    }
    var deferred = $.Deferred();
    var vt = { 'data': {}};
    // sqlite
    var db = new sqlite3.Database(dataPath+"/fplus.db");
    var command = "select PC,";
    var keys = ["Core","R0","R1","R2","R3","R4","R5","R6",
                "R7","R8","R9","R10","R11","R12","R13","R14",
                "RAM","BUS","PMD","RDC","VE","CLK","INTC","ADC",
                "DMAC","WDT","TCMP","EXCITER","GPIO","MODE",
                "RESET","FLASH","PWM","CAN","UART"];
    var k = [];
    keys.forEach(function(key){
      k.push("sum(" + key + ") AS " + key);
    });
    command += k.join(",");
    command += " from detail";
    command += " where ";
    if(options.__query__ !== undefined){
      var condition = [];
      options.__query__.query.forEach(function(d){
        condition.push(d.key + " == \'" + d.value + "\'");
      });
      command += " (" + condition.join(" and ") + ") and ";
    }
    command += " PC != ''";
    command += " group by PC";
    command += ";";
    console.log("[COMMAND]::" + command);
    db.serialize(function(){
      db.all(command , function(err,data){
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
