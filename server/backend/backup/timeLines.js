function BarChart () {
  
  //private members ( static variables)
  var fs = require('fs');
  var $ = require('jquery-deferred');
  
  //public member for asyn call
  this.syn = function(options) {
    console.log('request options:  ' + JSON.stringify(options)  );
    var fs = require('fs');
    var vt = {data:{}};
    return vt;
  };
}

module.exports = new BarChart();