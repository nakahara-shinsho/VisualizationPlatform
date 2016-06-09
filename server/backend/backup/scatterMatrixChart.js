function MyClass () {
  
  //private members ( static variables)
  var fs = require('fs');
  var $ = require('jquery-deferred');
  
  //public member for asyn call
  this.asyn = function(options) {
    console.log('request options:  ' + JSON.stringify(options)  );
 
    var deferred = $.Deferred();
    var vt = { 'data': {}};

    fs.readFile(__dirname+'/data/scatter_matrix_chart.csv', 'utf8', function(err, text){
      if(err){
        vt.data.format = 'error';
        vt.data.filled = err;
        deferred.reject(vt);
      }else{
        vt.data.format = 'csv';
        vt.data.filled = text;
        vt.data.mappable = true;
        vt.data.big = 1; //big rows
        deferred.resolve(vt);
      }
    });
    return deferred.promise();
  };
}

module.exports = new MyClass();