function MyClass (dbs) {
  var BIG = {
        NONE: 0,
        ROW: 1,
        COLUMN: 2,
        BOTH: 3 
    };

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();
  var exec = require("child_process").execSync;
  var StringDecoder = require('string_decoder').StringDecoder;
  var decoder = new StringDecoder('UTF-8');
  var types = {
    'RECORD_INFO_ID_USER_TIME'   : "number",
    'RECORD_INFO_ID_USER_ANGLOG' : "number",
    'RECORD_INFO_ID_USER_CURULOG': "number",
    'RECORD_INFO_ID_USER_CURVLOG': "number",
    'RECORD_INFO_ID_USER_CURWLOG': "number",
    'RECORD_INFO_ID_USER_RPMLOG' : "number",
    'TEST_EXECUTION_ID'          : "string"
  };
  var ranges = {};
//    var db = new sqlite3.Database(dataPath+"/fplus.db");
  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log(">> [WORKER] :: fplus_TimeSeries.js");
    console.log('request options:  ' + JSON.stringify(options)  );

    if(options !== undefined &&
       options._context_ !== undefined &&
       options._context_._database_ !== undefined){
      dataPath += options._context_._database_;
    }
    var deferred = $.Deferred();
    var vt = { 'data': {}};

    var dbPath = dataPath+"/fplus.db";
    if(Object.keys(ranges).length == 0){
      var command = "sqlite3 -csv " + dbPath + " 'select TEST_EXECUTION_ID  from timeseries group by TEST_EXECUTION_ID'";
        var info = exec(command);
      ranges = {
        'TEST_EXECUTION_ID'          :(decoder.write(info)).split("\n")
      };
    }
    var query= "select ";
    if(options._select_){
      query  +=  options._select_.join(",") + " from timeseries ";
    }else{
      query += "* from timeseries";
    }
    var conds = [];
    if(options._where !== undefined){
      options._where_.TEST_EXECUTION_ID.forEach(function(d){
        conds.push(" (TEST_EXECUTION_ID = \"" + d + "\")");
      });
      query  += " where " + conds.join(" OR ");
    }
    command  = "sqlite3 -csv -header " + dbPath + " '" + query + "'" ;
    console.log(command);
    var info = exec(command);
    vt.data.mappable = true;
    vt.data.format   = "csv";
    vt.data.ranges   = ranges;
    vt.data.types    = types;
    vt.data.filled   = decoder.write(info);
    vt.data.big = BIG.NONE;
    deferred.resolve(vt);
    return deferred.promise();
  };
  return this;
}

module.exports = MyClass;
