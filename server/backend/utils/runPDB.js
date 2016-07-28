
exports.createQuery = function(options, vtname, dataPath, filename) {
  console.log("[INFO] : Receive Request @ VT Name :: " + vtname);
  console.log('[INFO] : Request options:  ' + JSON.stringify(options)  );
  var $ = require('jquery-deferred');
  var exec = require("child_process").execSync;
  var fs = require("fs");
  var query = JSON.parse(fs.readFileSync(vtname, 'utf8'));
  var tmp = require("tmp");
  var StringDecoder = require('string_decoder').StringDecoder;
  var decoder = new StringDecoder('UTF-8');
  //var deferred = $.Deferred();
  var response = {};
  var core = 16;

  console.log(query);
  // Calc Range
  var ranges = {};
  calcRange();
  console.log("== RANGE ==");
  console.log(ranges);

  // Calc Slice InverVal
  updateSliceInterval();
  // Update Filter
  updateFilter();

  var tmpobj = tmp.fileSync({postfix:".json"});
  var command = "echo '" + JSON.stringify(query) + "' > " + tmpobj.name+  ";cd " + dataPath + ";";
  command += "pdb2csv -p "+ core +" -conf " + tmpobj.name  +"  -pdb " + dataPath +"/" + filename;
  command += "; rm -f " + tmpobj.name;
  console.log(command);

  var result = exec(command);
  response._table_ = {};
  response._table_.format = "csv";
  response._table_.ranges = ranges;
  response._table_.filled = decoder.write(result);
  return  response;

  /*********
   * Range *
   *********/
  // Calc Range for SetInterval
  function calcRange(){
    var rangeQuery = { "query":{"select":[],"approx_aggregate": false},"option":{"csv_comma": ","}};
    if(query.query.select !== undefined){
      // Select
      var pushedCols = [];
      query.query.select.forEach(function(col){
        if(pushedCols.indexOf(col.column) == -1){
          rangeQuery.query.select.push({"column":col.column,"aggregate":"min"});
          rangeQuery.query.select.push({"column":col.column,"aggregate":"max"});
          rangeQuery.query.select.push({"column":col.column,"aggregate":"count"});
        }
      });
      var tmpobj = tmp.fileSync({postfix:".json"});
      var command = "echo '" + JSON.stringify(rangeQuery) + "' > " + tmpobj.name+  ";cd " + dataPath + ";";
      command += "pdb2csv -conf " + tmpobj.name  +"  -pdb " + dataPath +"/" + filename + ";";
      command += " rm -f " + tmpobj.name;
      console.log(command);
      var result = exec(command);
      var index2name = {};
      var colName;
      decoder.write(result).split("\n").forEach(function(row,i){
          if(i == 0){
            row.split(",").forEach(function(col,j){
              if(col.indexOf("(") !== -1){
                colName = col.split("(")[1].split(")")[0];
                if(ranges[colName] == undefined){
                  ranges[colName] = [];
                }
              }else{
                colName = col;
                if(ranges[colName] == undefined){
                  ranges[colName] = [0];
                }
              }
              index2name[j] = colName;
            });
          }else{
            row.split(",").forEach(function(col,j){
              ranges[index2name[j]].push(+col);
            });
          }
      });
    }
    // Where
    if(options._where_ !== undefined){
      for(var key in options._where_){
        if(ranges[key] !== undefined){
          ranges[key] = options._where_[key];
        }
      }
    }
  }
  /**********
   * Filter *
   **********/
  function updateFilter(){
    if(options._where_ !== undefined &&
       query.query.where !== undefined){
      for(var col in options._where_){
        query.query.where.forEach(function(q){
          // remove aggregation-type name;
          var realColName = col;
          if(col.indexOf("(") !== -1){
            realColName = col.split("(")[1].replace(")","");
          }
          if(realColName == q.column){
            if(q.between !== undefined){
              q.between.lower = parseInt(options._where_[col][0]);
              q.between.upper = parseInt(options._where_[col][1]);
            }else if(q.in_values !== undefined){
              q.in_values = options._where_[col];
            }
          }
        });
      }
    }
    // Check Query
    var deleteWheres = [];
    query.query.where.forEach(function(q){
      if(q.between !== undefined){
        if(q.between.lower == undefined ||
           q.between.upper == undefined){
          deleteWheres.push(q);
        }
      }else if(q.in_values !== undefined){
        if(q.in_values == undefined ||
           q.in_values.length == 0){
          deleteWheres.push(q);
        }
      }else if(q.in_strings !== undefined){
        if(q.in_strings == undefined ||
           q.in_strings.length == 0){
          deleteWheres.push(q);
        }
      }
    });
    deleteWheres.forEach(function(w){
      var index = query.query.where.indexOf(w);
      query.query.where.splice(index,1);
    });
  }
  function updateSliceInterval(){
    console.log(">> Update Slice Interval");
    console.log(options);
    if(query.query !== undefined &&
       query.query.group_by !== undefined &&
       options._spk_ !== undefined){
      for(var col in options._spk_){
        // remove aggregation-type name;
        var realColName = col;
        if(col.indexOf("(") !== -1){
          realColName = col.split("(")[1].replace(")","");
        }
        query.query.group_by.forEach(function(q){
          if(realColName == q.column){
            console.log(q.sliceInterval);
            console.log("==================");
            console.log(" >>" + realColName);
            console.log(ranges[realColName]);
            /***********************
             * HARD CODED FOR TEST *
             ***********************/
            var pixel = 1;
            /***********************/
            // get max/min
            var info = [];
            if(ranges[q.column] !== undefined){
              if(options._where_ !== undefined && options._where_[q.column] !== undefined){
                info.push(parseInt(options._where_[q.column][0]));
                info.push(parseInt(options._where_[q.column][1]));
              }else{
                  info.push(parseInt(ranges[q.column][0]));
                info.push(parseInt(ranges[q.column][1]));
              }
              var range  = info[1] - info[0];
              console.log("range ::" + range); 
              q.sliceInterval = parseInt((pixel*range) / parseInt(options._spk_[col]));
              if(q.sliceInterval == 0){
                q.sliceInterval = 1;
              }
            }
          }
        });
      }
    }
  }
};

