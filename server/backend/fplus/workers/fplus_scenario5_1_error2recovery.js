function MyClass (dbs) {
  var BIG = {
    NONE  : 0,
    ROW   : 1,
    COLUMN: 2,
    BOTH  : 3
  };
  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();
  var histogram =  require("./histogram");
  this.vts = function(wk_name){
    return [wk_name];
  };
  
  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log("============================================");
    console.log(">> [WORKER] :: fplus_scenario5_1_error2fault.js");
    console.log('request options:  ' + JSON.stringify(options)  );

    if(options !== undefined &&
       options._context_ !== undefined &&
       options._context_._database_ !== undefined){
      dataPath += options._context_._database_;
    }
    var splitValue = 10;
    var powDigit   = 2;

    var deferred = $.Deferred();
    var response = { _table_: {format: "csv"}};

    // sqlite
    var db = dbs[dataPath];
    if(!db) {
      db= new sqlite3.Database(dataPath+"/fplus.db");
      dbs[dataPath]=db;
    }
    histogram.exec(db, splitValue, powDigit, "リカバリ時間", "scenario_5_1_testlist", deferred);
    return deferred.promise();
  };
  return this;
}

module.exports = MyClass;
