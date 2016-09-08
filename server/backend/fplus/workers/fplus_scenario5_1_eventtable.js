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
	console.log(">> [WORKER] :: fplus_scenario5_1_eventTable.js");
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
	var command = "select *  from scenario_5_1_eventTable";
	if(options._extra_where_){
	    // From scenario5-1:TimeSeriesWithoutEvent
	    wk_vtName = 'scenario5-1:TimeSeriesWithoutEvent.scenario5-1:TimeSeriesWithoutEvent';
	    var range = options._extra_where_[wk_vtName];
	    if(range !== undefined){
		command += " where テスト実行ID in (select テスト実行ID from scenario_5_1_testlist  where ";
		var queries = [];
		for(var k in range){
		    queries.push(" " + k + " >= " + range[k][0]);
		    queries.push(" " + k + " <= " + range[k][1]);
		}
		command += queries.join(" AND ") + " group by テスト実行ID)";
	    }
	    
	    
	    // From scenario5-1:TestList
	    wk_vtName = 'scenario5-1:TestList.scenario5-1:TestList';
	    var testExecIds = options._extra_where_[wk_vtName]["テスト実行ID"];
	    if(testExecIds !== undefined && testExecIds !== ''){
		if(range !== undefined){
		    command += " AND (テスト実行ID in (\"" + testExecIds.join(",").replace(/,/g, "\",\"") + "\")) ";
		}else{
		    command += " where (テスト実行ID in (\"" + testExecIds.join(",").replace(/,/g, "\",\"") + "\"))";
		}
	    }
	    command += " AND VALUE != \"TYPE_TIME_SERIES\"";
	}else{
	    command += " where (VALUE != \"TYPE_TIME_SERIES\") limit 100";
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
			'scenario5-1:TestList.scenario5-1:TestList',
			'scenario5-1:故障注入->故障検出.scenario5-1:故障注入->故障検出',
			'scenario5-1:故障検出->異常検出.scenario5-1:故障検出->異常検出',
			'scenario5-1:故障検出->リカバリ.scenario5-1:故障検出->リカバリ'
		    ];
		    deferred.reject(response);
		}else{
		    var csv = [];
		    var header = [];
		    console.log("----------------------------------------");
		    if(data.length > 0){
			for(var k in data[0]){
			    header.push(k);
			}
		    }else{
			header.push("テスト実行ID")
			header.push("TIME")
			header.push("イベントID")
			header.push("イベントタイプ")
			header.push("VALUE")
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
		    response._table_.big = BIG.NONE;
		    response._table_.family = [
			'fplus_matrix.fplus_matrix',
			'scenario5-1:TestList.scenario5-1:TestList',
			'scenario5-1:TimeSeriesWithEvent.scenario5-1:TimeSeriesWithEvent',
			'scenario5-1:TimeSeriesWithoutEvent.scenario5-1:TimeSeriesWithoutEvent',
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
