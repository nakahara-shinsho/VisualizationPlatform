function MyClass () {

  //private members ( static variables)
  var $ = require('jquery-deferred');
  //var hl    = require("highlight").Highlight;
  var fs   =  require("fs");

  this.vts = function(wk_name){
    return [wk_name];
  };

  //public member for asyn call
  this.asyn = function(options,dataPath) {
    console.log(">> [WORKER] :: fplus_Four-quadrant.js");
    console.log('request options:  ' + JSON.stringify(options)  );


    if(options !== undefined &&
       options._database_ !== undefined){
      dataPath += options._database_;
    }

    var deferred = $.Deferred();
    var vt = { 'data': {}};
    var csv = [];
    csv.push("Quadrant");
    csv.push("未検出／異常");
    csv.push("検出／異常");
    csv.push("未検出／正常");
    csv.push("検出／正常");
    vt.data.mappable = true;
    vt.data.format   = "csv";
    vt.data.filled   = csv.join("\n").concat();
    deferred.resolve(vt);
    return deferred.promise();
  };
}


module.exports = new MyClass();
