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

  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log("============================================");
    console.log(">> [WORKER] :: fplus_scenario5_1_testlist.js");
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
    var wk_vtName = "";
    var command = "select *  from scenario_5_1_testlist";
    if(options._extra_where_){
      wk_vtName = 'scenario5-1:TimeSeriesWithoutEvent.scenario5-1:TimeSeriesWithoutEvent';
      var range = options._extra_where_[wk_vtName];
      if(range !== undefined){
        command += " where テスト実行ID in (select テスト実行ID from scenario_5_1_timeseries where ";
        var queries = [];
        for(var k in range){
	    if(range[k][0] !== undefined && range[k][1] !== undefined){
		queries.push(" " + k + " >= " + range[k][0]);
		queries.push(" " + k + " <= " + range[k][1]);
	    }
        }
        command += queries.join(" AND ") + " group by テスト実行ID)";
      }
    }
    console.log(command);
    db.serialize(function(){
      db.all(command, function(err,data){
        if(err){
          console.log(err);
          var response = { _table_: {format: "_error_"}};
          response._table_.filled = err;
          response._table_.big = BIG.BOTH;
          response._table_.family = [
            'fplus_matrix.fplus_matrix',
            'scenario5-1:TimeSeriesWithEvent.scenario5-1:TimeSeriesWithEvent',
            'scenario5-1:TimeSeriesWithoutEvent.scenario5-1:TimeSeriesWithoutEvent',
            'scenario5-1:EventTable.scenario5-1:EventTable',
            'scenario5-1:故障注入->故障検出.scenario5-1:故障注入->故障検出',
            'scenario5-1:故障検出->異常検出.scenario5-1:故障検出->異常検出',
            'scenario5-1:故障検出->リカバリ.scenario5-1:故障検出->リカバリ'
          ];
          deferred.reject(response);
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
          var response = { _table_: {format: "csv"}};
          response._table_.filled = csv.join("\n");
          response._table_.big = BIG.BOTH;
          response._table_.family = [
            'fplus_matrix.fplus_matrix',
            'scenario5-1:TimeSeriesWithEvent.scenario5-1:TimeSeriesWithEvent',
            'scenario5-1:TimeSeriesWithoutEvent.scenario5-1:TimeSeriesWithoutEvent',
            'scenario5-1:EventTable.scenario5-1:EventTable',
	    'scenario5-1:故障注入->故障検出.scenario5-1:故障注入->故障検出',
            'scenario5-1:故障検出->異常検出.scenario5-1:故障検出->異常検出',
            'scenario5-1:故障検出->リカバリ.scenario5-1:故障検出->リカバリ'
          ];
          deferred.resolve(response);
        }
      });
    });
    return deferred.promise();
  };
  return this;
}

module.exports = MyClass;
