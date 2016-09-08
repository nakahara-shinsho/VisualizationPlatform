function MyClass (){
  var BIG = {
    NONE  : 0,
    ROW   : 1,
    COLUMN: 2,
    BOTH  : 3
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
    'VALUE_TYPE'                 : "string",
    'テスト実行ID'               : "string",
    'FOUR_QUATRAND'              : "string"
  };
  var family = [
      'fplus_matrix.fplus_matrix',
      'scenario5-1:TimeSeriesWithoutEvent.scenario5-1:TimeSeriesWithoutEvent',
      'scenario5-1:故障注入->故障検出.scenario5-1:故障注入->故障検出',
      'scenario5-1:故障検出->異常検出.scenario5-1:故障検出->異常検出',
      'scenario5-1:故障検出->リカバリ.scenario5-1:故障検出->リカバリ',
      'scenario5-1:TestList.scenario5-1:TestList'
  ];
  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log("============================================");
    console.log(">> [WORKER] :: fplus_scenario5_1_timeseriesWithEvent.js");
    console.log('request options:  ' + JSON.stringify(options)  );

    if(options !== undefined &&
       options._context_ !== undefined &&
       options._context_._database_ !== undefined){
      dataPath += options._context_._database_;
    }
    var deferred = $.Deferred();
    var response = { _table_: {format: "csv"}};
     

   var dbPath = dataPath+"/event.db";
   var wk_vtName = "";
    var command = "select * from timeseries ";
    if(options._extra_where_){
      var testExecIds = [];
      wk_vtName = 'scenario5-1:TestList.scenario5-1:TestList';
      if(options._extra_where_[wk_vtName] !== undefined){
        var conds = options._extra_where_[wk_vtName];
        testExecIds = conds["テスト実行ID"];
	  console.log(testExecIds);

      }
      if(testExecIds.length > 0){
          command += " where (テスト実行ID in (\"" + testExecIds.join(",").replace(/,/g, "\",\"") + "\"))";
      }
    }
    if(options._extra_where_ == undefined || testExecIds.length == 0){
	console.log("NONE");
        command += " limit 0";
    }
    console.log(command);
    var info = exec("sqlite3 -csv -header  " + dbPath + " '" + command + "'");
    response._table_.filled   = decoder.write(info);
    response._table_.types    = types;
    response._table_.family = family;

    response._table_.big = BIG.NONE;
    deferred.resolve(response);
    return deferred.promise();
  };
  return this;
}

module.exports = MyClass;
