function MyClass () {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  var sqlite3 = require("sqlite3").verbose();

  //public member for asyn call
  this.asyn = function(options) {
    console.log('request options:  ' + JSON.stringify(options)  );
    var deferred = $.Deferred();
    var vt = { 'data': {}};
    // sqlite
    var db = new sqlite3.Database(__dirname+"/data/fplus.db");
    db.serialize(function(){
      db.all("select sum(未検出／異常) AS 故障未検出／異常,sum(検出／異常) AS 故障検出／異常,sum(未検出／正常) AS 故障未検出／正常,sum(検出／正常) AS 故障検出／正常 from errorData", function(err,data){
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
