var sqlite_tool = new (require('./sqlite_tool.js'))();
var queryTool = new (require('./queryTool.js'))();
var fs = require('fs');
function ReadSQLite () {
  var table;
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
  this.asyn = function(options, entrance, filename) {
    if(filename.indexOf("::") !== -1){
       var fileinfo = filename.split("::"); 
       if(fileinfo.length == 2){
         this.name      = fileinfo[0];
	 this.query = fileinfo[1];
       }
    }
    if (this.query != undefined) {
       var deferred = $.Deferred();
       var response = {};
       var text = sqlite_tool.execute(entrance, this.name, this.query);	    
       response._table_ = {};
       response._table_.big = BIG.NONE;
       /*formatはcsvにしておく*/
       response._table_.format = "csv";
       response._table_.filled = text;
       deferred.resolve(response);      
    }
    return deferred.promise();
  };
}
module.exports = ReadSQLite;