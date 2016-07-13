require('../../util/wrapperConsoleForLog4js.js')
var amqp = require('amqplib');
var config = require('config') ;
var fs = require('fs');
var callback = new (require('./ReadSQLite.js'))();
var entrance = __dirname+'/data/';
var sqlite_tool = new (require('../sqlite/sqlite_tool.js'))();
var queryTool = new (require('../sqlite/queryTool.js'))();
function collector (path) {
  var sqliteFiles = [];
  var files = [];  
  getSQLiteFiles();
  sqliteFiles.forEach(function (sqliteFile) {
    var schemaObj = sqlite_tool.getSchemaObject(entrance, sqliteFile);
    Object.keys(schemaObj).forEach(function(key) {
      var queries = queryTool.getMatchedQueriesFromSchema(key, schemaObj[key]);
      queries.forEach(function (query) {
        files.push(sqliteFile + "::" + query);
      });
    });
  });
  return files;
  function getSQLiteFiles() {
      var list = fs.readdirSync(path); //get all contents under path
      for(var i=0; i<list.length; i++){
	  var fullPath = path + list[i];
	  try{
	      var st = fs.statSync(fullPath);
	      if(st.isFile()){
		  var ext = list[i].split('.').pop().toLowerCase();
		  if(ext==='csv' || ext==='tsv'
		     || ext==='db' || ext ==='sqlite3') {
		      sqliteFiles.push(list[i]);
		  }
	      }
	  } catch(e) {
	      console.log("error:"+e.message);
	  }
      }  
      return sqliteFiles;
  }
}

amqp.connect('amqp:'+ config.get('RabbitMQ.server.host')).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var fs = require('fs');
    var mqBackend = new (require('../utils/MqBackend'))(ch);
    setInterval(function(){
    mqBackend.starts('TABLE', entrance, collector(entrance), callback);    
	}, 3000);
  });
}).then(null, console.warn);
