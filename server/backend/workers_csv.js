require('../util/wrapperConsoleForLog4js.js')
var amqp = require('amqplib'),
      config = require('config'),
      fs = require('fs');
var pathLib = require('path');
var gconfig = JSON.parse( fs.readFileSync(__dirname+'/config.json', 'utf8') );
var entrance = gconfig.dataPath.toString();
callback = new (require('./utils/ReadFileForDataList.js'))();

function collector (path) {
    var files = [];
    
    var list = fs.readdirSync(path); //get all contents under path
    for(var i=0; i<list.length; i++){
      var fullPath = path + list[i];
      try{
        var st0 = fs.statSync(fullPath);
	if(st0.isDirectory()){
	 var fileList = fs.readdirSync(fullPath);
	    for(var j=0; j<fileList.length; j++){
		var st = fs.statSync(fullPath + "/"+ fileList[j]);
		if(st.isFile()){
		    var ext__ = fileList[j].split('.');
		    var ext = ext__[ext__.length - 1].toLowerCase();
		    if(ext==='csv' || ext==='tsv') {
			files.push(fileList[j]);
		    }
		}
	    }
	    break;
	}
      } catch(e) {
        console.log("error:"+e.message);
      }
    }  
    return files;
}

amqp.connect('amqp:'+ config.get('RabbitMQ.server.host')).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var mqBackend = new (require('./utils/MqBackend'))(ch);
    setInterval(function(){
      mqBackend.starts('TABLE', entrance, collector(entrance), callback);
    }, 3000);
  });
}).then(null, console.warn);
