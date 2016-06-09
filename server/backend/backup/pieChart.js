function MyClass () {
  
  //private members ( static variables)
  var fs = require('fs');
  var $ = require('jquery-deferred');
  
  //public member for asyn call
  this.asyn = function(options) {
    console.log('request options:  ' + JSON.stringify(options)  );
 
    var deferred = $.Deferred();
    var vt = { '_data_': {}};

    fs.readFile(__dirname+'/data/pie_chart.csv', 'utf8', function(err, text){
      if(err){
        vt._data_.format = 'error';
        vt._data_.filled = err;
        deferred.reject(vt);
      }else{
        vt._data_.format = 'csv';
        vt._data_.filled = text;
        deferred.resolve(vt);
      }
    });
    return deferred.promise();
  };
}

module.exports = new MyClass();