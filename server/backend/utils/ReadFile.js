function ReadFile () {

  var BIG = {
        NONE: 0,
        ROW: 1,
        COLUMN: 2,
        BOTH: 3 
    };

  //private members ( static variables)
  var fs = require('fs');
  var $  = require('jquery-deferred');
  
  //public member for asyn call
  this.vts = function(wk_name) {
      return ['original'];
  };

  this.asyn = function(options, entrance, filename) { 
    
    this.name = filename;
    
    console.log('request options:  ' + JSON.stringify(options)  );
    
    var deferred = $.Deferred();
    var response = {};

    fs.readFile(entrance + filename, 'utf8', function(err, text){
      if(err){
        response._error_= {};
        response._error_.format = 'json';
        response._error_.filled = err;
        deferred.reject(response);
      } else {
        response._table_ = {};
        response._table_.big = BIG.NONE;
        response._table_.format = filename.split('.').pop().toLowerCase();
        response._table_.filled = text;
        deferred.resolve(response);
      }
    });
    
    return deferred.promise();
  };
}

module.exports = ReadFile;
