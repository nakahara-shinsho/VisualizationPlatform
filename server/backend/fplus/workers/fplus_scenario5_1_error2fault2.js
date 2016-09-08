function MyClass (dbs) {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();
  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log("============================================");
    console.log(">> [WORKER] :: fplus_scenario5_1_fi2error.js");
    console.log('request options:  ' + JSON.stringify(options)  );

    if(options !== undefined &&
       options._context_ !== undefined &&
       options._context_._database_ !== undefined){
      dataPath += options._context_._database_;
    }
    var splitValue = 10;
    var powDigit   = 2;

    // sqlite
    var db = dbs[dataPath];
    if(!db) {
      db= new sqlite3.Database(dataPath+"/fplus.db");
      dbs[dataPath]=db;
    }

    var hist = require("./histogram.js");
    hist.exec(db, splitValue, powDigit, "故障注入->故障検出", "scenario_5_1_testlist");
  };
  return this;
}

module.exports = MyClass;
