function MyClass () {
  //private members ( static variables)
  var fs = require('fs');
  var $ = require('jquery-deferred');

  //public member for asyn call
  this.asyn = function(options) {
    console.log('request options:  ' + JSON.stringify(options)  );
    var deferred = $.Deferred();
    var vt = { '_table_': {} };
    fs.readFile(__dirname+'/data/line_chart.csv', 'utf8', function(err, text){
      if(err){
        vt._table_.format = '_error_';
        vt._table_.filled = err;
        deferred.reject(vt);
      }else{
        vt._table_.format = 'csv';
        vt._table_.filled = text;
        deferred.resolve(vt);
      }
    });
    return deferred.promise();
  };
}

module.exports = new MyClass();
