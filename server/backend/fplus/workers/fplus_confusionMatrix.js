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
    console.log(">> [WORKER] :: fplus_confutionMatrix.js");
    console.log('request options:  ' + JSON.stringify(options)  );

    if(options !== undefined &&
       options._context_ !== undefined &&
       options._context_._database_ !== undefined){
      dataPath += options._context_._database_;
    }
    var deferred = $.Deferred();
    var response = { _table_: {format: "csv"}};
    // sqlite
    var db = dbs[dataPath];
    if(!db) {
      db= new sqlite3.Database(dataPath+"/fplus.db");
      dbs[dataPath]=db;
    }
    db.serialize(function(){
      db.all("select sum(未検出／異常) AS 未検出／異常,sum(検出／異常) AS 検出／異常,sum(未検出／正常) AS 未検出／正常,sum(検出／正常) AS 検出／正常,sum(未検出／異常) + sum(検出／異常) + sum(未検出／正常) + sum(検出／正常) AS total from errorTable", function(err,data){
        if(err){
          response._table_.format = "_error_";
          response._table_.filled = err;
          response._table_.family = [
            'scenario5-1:TimeSeriesWithoutEvent',
            'scenario5-1:故障注入->故障検出',
            'scenario5-1:故障検出->異常検出',
            'scenario5-1:故障検出->リカバリ',
            'scenario5-1:TestList'
          ];
          deferred.reject(response);
        }else{
          var csv = [];
          var header = [];
          for(var k in data[0]){
            header.push(k);
          }
          var fourQuatrand = ["未検出／異常","検出／異常","未検出／正常","検出／正常"];
	  //header.push("FOUR_QUATRAND");
          csv.push(header.join(","));
          for(var i=0; i < data.length; i++){
            var row = [];
            header.forEach(function(key){
		if(key !== "FOUR_QUATRAND"){
		    row.push(data[i][key]);
		}else{
		    //row.push(fourQuatrand[0]);
		}
            });
            csv.push(row.join(","));
          }
          response._table_.filled = csv.join("\n");
          response._table_.family = [
            'scenario5-1:TimeSeriesWithoutEvent.scenario5-1:TimeSeriesWithoutEvent',
            'scenario5-1:故障注入->故障検出.scenario5-1:故障注入->故障検出',
            'scenario5-1:故障検出->異常検出.scenario5-1:故障検出->異常検出',
            'scenario5-1:故障検出->リカバリ.scenario5-1:故障検出->リカバリ',
            'scenario5-1:TestList.scenario5-1:TestList,'
          ];
          deferred.resolve(response);
        }
      });
    });
    return deferred.promise();
  };
  return this;
}

module.exports =  MyClass;
