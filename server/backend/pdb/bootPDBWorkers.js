
var amqp    = require('amqplib');
var config  = require('config');
var fs      = require('fs');
var pathLib = require('path');
var gconfig = JSON.parse( fs.readFileSync(__dirname+'/../config.json', 'utf8') );
var entrance = gconfig.dataPath.toString();
var mode     = "last"; // [all, last, direct]
console.log("[INFO] :: boot PDB Workers");
console.log("[INFO] :: <--- help info ---> ");
console.log("[INFO] ::  bootPDBWorker [SEARCH_MODE=all/last(default)] or [DIRECT_MODE]");

if(process.argv.length == 3){
  if(process.argv[2] == "all"){
    mode = "all";
  }else if(process.argv[2] == "last"){
    mode = "last";
  }else{
    mode = "direct";
    entrance = process.argv[2];
  }
  console.log("[INFO] :: TARGET DIR ->" + entrance);
}else{
  mode = "last";
  console.log("[INFO] :: TARGET DIR ->" + entrance +"/*");
}

function collector (path) {
  var exec = require('child_process').execSync;
  var StringDecoder = require('string_decoder').StringDecoder;
  var decoder = new StringDecoder('UTF-8');

  var files = [];
  /*********************
   * Get Virtual Table *
   *********************/
  var virtualTables = []; // {"vtname" : vtname, "columns": [columname]}
  getVirtualTables();
  console.log("[INFO] :: VirtualTable for PDB ");
  virtualTables.forEach(function(vt){
    console.log("[INFO] :: VT [" + vt.name + "]");
  });

  /****************
   * Get PDB File *
   ****************/
  var targetPDBs = [];
  getPDBFiles();

  /***************
   * Worker List *
   ***************/
  targetPDBs.forEach(function(pdb){
    virtualTables.forEach(function(vt){
      var match = true;
      for(var i=0 ; i < vt.columns.length; i++){
        if(pdb.columns.indexOf(vt.columns[i]) == -1){
          match = false;
          break;
        }
      }
      if(match){
        files.push(pdb.name.replace(".db","") + "::" + vt.name);
      }
    });
  });
  return files;

  function getVirtualTables(){
    var vts   = fs.readdirSync(__dirname+"/VirtualTable/");
    for(var i=0; i<vts.length; i++){
      if(vts[i].indexOf(".json.template") !== -1 &&
         vts[i].indexOf(".json.template~") === -1){
        var vtname =  vts[i].replace(".json.template","");
        var columns = getColumnsFromQuery(vts[i]);
        if(columns !== undefined){
          var vt = {
            "name" : vtname,
            "columns": columns
          };
          virtualTables.push(vt);
        }
      }
    }
  }

  function getPDBFiles(){
    var list  = fs.readdirSync(path); //get all contents under path
    if(mode == "direct"){
      // DEBUG MODE
      list.forEach(function(fileCandidate){
        var tmpPath = path + "/" + fileCandidate;
        if(fileCandidate.lastIndexOf(".db", fileCandidate.length) == (fileCandidate.length - 3)){
          if(fs.statSync(tmpPath).isFile()){
            var columns = getColumnsFromPDB(tmpPath);
            if(columns !== undefined){
              var pdb = {
                "name"   : fileCandidate,
                "columns": columns
              };
              targetPDBs.push(pdb);
            }
          }
        }
      });
    }else if(mode == "last"){
      // DATA LIST MODE [Check Last]
      var dir   = undefined;
      var mtime = 0;
      list.forEach(function(dir__){
        if(dir == undefined){
          dir   = dir__;
          mtime = fs.statSync(path + "/" + dir__).mtime.getTime();
        }else{
          var _mtime = fs.statSync(path + "/" + dir__).mtime.getTime();
          if(mtime < _mtime){
            dir = dir__;
            mtime = _mtime;
          }
        }
      });
      var tmpList = fs.readdirSync(path+"/"+dir);
      tmpList.forEach(function(fileCandidate){
        var tmpPath = path + "/" + dir + "/" + fileCandidate;
        if(fileCandidate.lastIndexOf(".db", fileCandidate.length) == (fileCandidate.length - 3)){
          if(fs.statSync(tmpPath).isFile()){
            var columns = getColumnsFromPDB(tmpPath);
            if(columns !== undefined){
              var pdb = {
                "name"   : fileCandidate,
                "columns": columns
              };
              targetPDBs.push(pdb);
            }
          }
        }
      });
    }else if(mode == "all"){
      // DATA LIST MODE [Check ALL]
      list.forEach(function(dir){
        var tmpList = fs.readdirSync(path+"/"+dir);
        tmpList.forEach(function(fileCandidate){
          var tmpPath = path + "/" + dir + "/" + fileCandidate;
          if(fileCandidate.lastIndexOf(".db", fileCandidate.length) == (fileCandidate.length - 3)){
            if(fs.statSync(tmpPath).isFile()){
              var columns = getColumnsFromPDB(tmpPath);
              if(columns !== undefined){
                var pdb = {
                  "name"   : fileCandidate,
                  "columns": columns
                };
                targetPDBs.push(pdb);
              }
            }
          }
        });
      });
    }
  }
  function getColumnsFromQuery(vt){
    try {
      var query = JSON.parse(fs.readFileSync(__dirname+"/VirtualTable/" + vt, 'utf8'));
      var columns = [];
      ["select", "where","group_by"].forEach(function(type){
        if(query.query[type]){
          query.query[type].forEach(function(cols){
            if(columns.indexOf(cols.column) === -1){
              columns.push(cols.column);
            }
          });
        }
      });
      return columns;
    }
    catch(e){
      console.warn("[WARN] :: " + vt + " is not JSON Format.");
      return undefined;
    }
    return undefined;
  }
  function getColumnsFromPDB(pdb){
    try {
      var columns = [];
      //var command = "cd " + pathLib.dirname(pdb) + ";";
      var command = "pdb2csv -pdb " + pathLib.dirname(pdb) +'/' + pathLib.basename(pdb)+ " -e .schema ";
      console.log(command);
      var result = exec(command);
      var schema = decoder.write(result);
      schema.split("(")[1].split(")")[0].split(",").forEach(function(s){
        var col = s.replace(/^\s+/,"");
        columns.push(col.split(" ")[0]);
      });
      return columns;
    }
    catch(e){
      console.warn("[WARN] :: Cannot get Schema from " + pdb);
      return undefined;
    }
    return undefined;
  }
}

amqp.connect('amqp:'+ config.get('RabbitMQ.server.host')).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var core = 2;
    var mqBackend = new (require('../utils/MqBackend'))(ch);
    setInterval(function(){
      var family  = collector(entrance);
      mqBackend.starts('TABLE', entrance, family, new (require(__dirname + '/PDB.js'))(family, core, mode));
    }, 5000);
  });
}).then(null, console.warn);

