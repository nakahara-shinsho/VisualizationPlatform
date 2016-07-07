var sqlite_tool = new (require('./sqlite_tool.js'))();
function MyCallBack () {
    var $  = require('jquery-deferred');
    var BIG = {
    NONE: 0,
    ROW: 1,
    COLUMN: 2,
    BOTH: 3 
    };

    this.vts = function(wk_name) {
	var ret = [];
	if(wk_name) {
	    ret = [wk_name];
	} else 
	    if(this.name){
		ret = [this.name];
	    }
	return ret;
    };

    this.asyn = function(options, entrance, filename, tableName) {
	var ext = filename.split('.').pop().toLowerCase();
	this.name = filename;
	console.log('request options:  ' + JSON.stringify(options));
	if (ext==='csv' || ext==='tsv' ) {   
	    return readFile();
	} else if (ext==='db' || ext ==='sqlite3') {
	    return readDatabase();
	} else {
	    console.log("Nandekana");
	}
	return;

	function readFile() {
	  var fs = require('fs');
	  var deferred = $.Deferred();
	  var response = {};
	  fs.readFile(entrance + filename, 'utf8', function(err, text){
		  if(err){
		      response._error_= {};
		      response._error_ .format = json;
		      response._error_ .filled  = err;
		      deferred.reject(response);
		      console.log("Fail to read " + entrance + filename);
		  } else {
		      response._table_ = {};
		      response._table_.big = BIG.NONE;
		      response._table_.format = filename.split('.').pop().toLowerCase();
		      response._table_.filled = text;
		      deferred.resolve(response);
		  }
	      });
	  return deferred.promise();
      }
    
    function readDatabase() {
	var deferred = $.Deferred();
	var response = {};
	var text = sqlite_tool.select(entrance, filename, tableName);
        response._table_ = {};
        response._table_.big = BIG.NONE;
	/*formatはcsvにしておく*/
        response._table_.format = "csv";
        response._table_.filled = text;
	deferred.resolve(response);      
	return deferred.promise();
    }
  };  
}
module.exports = MyCallBack;