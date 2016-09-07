
function MySQL(family) {
  var BIG = {
    NONE  : 0,
    ROW   : 1,
    COLUMN: 2,
    BOTH  : 3
  };
  //private members ( static variables)
  var fs = require('fs');
  var $  = require('jquery-deferred');
  var StringDecoder = require('string_decoder').StringDecoder;
  var decoder = new StringDecoder('UTF-8');
  var exec  = require('child_process').execSync;
  //public member for asyn call
  this.vts = function(wk_name) {
    var ret = [];
    if(wk_name) {
      ret = [wk_name];
    } else if(this.name){
      ret = [this.name];
    }
    return ret;
  };

  this.asyn = function(options, entrance, filename) { //filename is worker_name
    var dataPath = entrance ;
    var templateFile  = __dirname + "/VirtualTable/" + filename + ".json";
    console.log("[INFO] : Receive Request @ WorkerName :: " +  this.name);
    console.log('[INFO] : Request options:  ' + JSON.stringify(options)  );
    var deferred = $.Deferred();
    var response = {};
    if(templateFile !== undefined){
      // UPDATE QUERY
      var result = run();
      response._table_ = {};
      response._table_.big = BIG.BOTH;
      response._table_.format = "tsv";
      response._table_.filled = decoder.write(result);
      response._table_.family = family;
      deferred.resolve(response);
    }
    function run(){
      
      var __template__ = fs.readFileSync(templateFile);
	console.log(decoder.write(__template__));
      var template = JSON.parse(decoder.write(__template__));
      var data  = JSON.parse('"'+options._context_._database_+'"');
      var query = template.sql;
      updateFilter();
      var result = "";
	console.log(query);
      try {
        result = exec("mysql -ufplus -ppolyspector -e \"" + query +"\""); 
      }catch(e){
        console.log("[INFO]:: QUERY ERROR");
        console.log("[INFO]:: " + query);
      }
      return result;

      function updateFilter(){
        // WHERE
        var where = [];
        template.where.forEach(function(key){
          if(data[key] !== undefined){
            where.push(key + " = '" + data[key] + "'");
          }
        });
        if(where.length > 0){
          query += " WHERE ";
          query += where.join(" AND ");
        }
        // GROUPBY
        var groupby = [];
        if(template.groupby !== undefined){
          template.groupby.forEach(function(key){
            groupby.push(key);
          });
          if(groupby.length > 0){
            query += " GROUP BY ";
            query += groupby.join(",");
          }
        }
        // LIMIT
        if(template.limit !== undefined){
          query += " LIMIT " + template.limit;
        }
        console.log(query);
      }
    };
    return deferred.promise();
  };

}
module.exports = MySQL;
