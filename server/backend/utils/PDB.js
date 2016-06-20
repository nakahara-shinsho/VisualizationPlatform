function PDB (family) {

  var BIG = {
        NONE: 0,
        ROW: 1,
        COLUMN: 2,
        BOTH: 3
    };
  //private members ( static variables)
  var fs = require('fs');
  var $  = require('jquery-deferred');
  var exec = require('child_process').execSync;
  var tmp  = require('tmp');

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
    if(filename.indexOf("::") !== -1){
      var fileinfo = filename.split("::");
      if(fileinfo.length == 2){
        this.name      = filename;
        this.queryFile = __dirname + "/../pdb/VirtualTable/" + fileinfo[0]+".json.template";
        this.realFile  = fileinfo[1]+".db";
      }
    }
    console.log("[INFO] : Receive Request @ WorkerName :: " +  this.name);
    console.log('[INFO] : request options:  ' + JSON.stringify(options)  );
    var deferred = $.Deferred();
    var response = {};
    var dataPath = "/home/kuroda/devel/VisualizationPlatform/server/backend/pdb/sample/";
    if(this.queryFile !== undefined){
      // create query
      var query = JSON.parse(fs.readFileSync(this.queryFile, 'utf8'));
      // get time_stamp columnName
      var timestampColumnName =  getTimeStampColumnName(query);
      // update where
      query.where.time_range.lower = 0;
      query.where.time_range.upper = -1;
      if(options._where_ !== undefined){
        for(var i=0; i<options._where_.length; i++){
          var vt = options._where_[i];
          if(vt[timestampColumnName] !== undefined && vt[timestampColumnName] !== null){
            if(vt[timestampColumnName][0] !== undefined && vt[timestampColumnName][1] !== undefined){
              query.where.time_range.lower = Number(vt[timestampColumnName][0]);
              query.where.time_range.upper = Number(vt[timestampColumnName][1]);
            }
            break;
          }
        }
      }
      if(options._extra_where_ !== undefined){
        for(var vtname in options._extra_where_){
          var vt = options._extra_where_[vtname];
          if(vt[timestampColumnName] !== undefined && vt[timestampColumnName] !== null){
            if(vt[timestampColumnName][0] !== undefined && vt[timestampColumnName][1] !== undefined){
              query.where.time_range.lower = parseInt(vt[timestampColumnName][0]);
              query.where.time_range.upper = parseInt(vt[timestampColumnName][1]);
            }
            break;
          }
        }
      }
      /*********************************
       [CORRECT CODE]
       -> delete query["where"];
       ***********************************/
      var tmpobj = tmp.fileSync({postfix:".json"});
      var command = "echo '" + JSON.stringify(query) + "' > " + tmpobj.name+  ";cd " + dataPath + "; pdb2csv -conf " + tmpobj.name  +" -pdb " + this.realFile;
      console.log(command);
      var result = exec(command);
      var StringDecoder = require('string_decoder').StringDecoder;
      var decoder = new StringDecoder('UTF-8');
      tmpobj.removeCallback();
      response._table_ = {};
      response._table_.big = BIG.BOTH;
      response._table_.format = "csv";
      response._table_.filled = decoder.write(result);
      response._table_.family = family;
      deferred.resolve(response);
    }
    return deferred.promise();

    function getTimeStampColumnName(query){
      for(var i=0; i< query.columns.length ; i++){
        if(query.columns[i].type == "time"){
          return query.columns[i].name;
        }
      }
      return undefined;
    }
  };
}

module.exports = PDB;
