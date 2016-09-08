
exports.exec = function(db, splitValue, powDigit,colName, tableName, deferred){
  var response = { _table_: {format: "csv"}};
  var BIG = {
    NONE  : 0,
    ROW   : 1,
    COLUMN: 2,
    BOTH  : 3
  };
  db.serialize(function(){
    // get max,min
    var command = 'select MAX("'+ colName +'") AS max,MIN("'+ colName +'") AS min from ' + tableName+ ' where "'+ colName +'" != "-"';
    db.all(command, function(err0,data0){
      if(err0){
        console.log(err0);
        response._table_.format = "json";
        response._table_.filled = err0;
        deferred.reject(response);
      }
      // create query
      var _diff = (+data0[0].max) / splitValue;
      var _pow =Math.pow(10,powDigit);
      var delta = Math.round(_diff*_pow)/_pow;
      var curLow = 0;
      var curHigh = 0;
      if(delta == 0){
        delta  = Math.pow(0.1,powDigit);
      }
      command  = 'select ';
      for(var i=0; i<splitValue; i++){
        curHigh = curLow + delta;
        curHigh = Math.round(curHigh*_pow)/_pow;
        command += 'sum(case when "' + colName +'" >= ' + curLow + ' and ';
        command += ' "' + colName + '" < '+ curHigh + ' then 1 else 0 end ) as "'+ curLow +' - ' + curHigh + '"';
        if(i !== (splitValue-1)){
          command += ',';
        }
        curLow = curHigh;
      }
      command +=  ' from '+ tableName;
      console.log(">> Histogram");
      console.log(command);
      db.all(command, function(err,data){
        if(err){
          console.log(err);
          response._table_.format = "json";
          response._table_.filled = err;
          deferred.reject(response);
        }else{
          // Transposition
          var csv = [];
          csv.push("label,count");
          for(var k in data[0]){
            csv.push(k +"," + data[0][k] );
          }
          response._table_.filled   = csv.join("\n");
	  response._table_.big = BIG.BOTH;
          deferred.resolve(response);
        }
      });
    });
  });
};
