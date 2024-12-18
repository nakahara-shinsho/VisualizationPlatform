
var amqp   = require('amqplib');
var config = require('config');
var fs     = require('fs');
var path   = require ("path");
var gconfig = JSON.parse( fs.readFileSync(__dirname+'/../config.json', 'utf8') );
var entrance = gconfig.dataPath.toString();

var supportExtensions = [".rb",".js",".sh"];

console.log("[INFO] :: boot script Workers " + supportExtensions);
if(process.argv.length == 3){
  entrance = process.argv[2];
  console.log("[INFO] :: TARGET DIR ->" + entrance);
}else{
  console.log("[INFO] :: TARGET DIR ->" + entrance);
}


function collector () {
  var files = [];
  var vts   = fs.readdirSync(__dirname+"/VirtualTable/");
  var virtualTables = [];
  for(var i=0; i<vts.length; i++){
    if(supportExtensions.indexOf(path.extname(vts[i])) !== -1){
      virtualTables.push(vts[i].replace(path.extname(vts[i])));
    }
  }
  return virtualTables;
}

amqp.connect('amqp:'+ config.get('RabbitMQ.server.host')).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var mqBackend = new (require('../utils/MqBackend'))(ch);
    setInterval(function(){
      var family  = collector();
      mqBackend.starts('TABLE', entrance, family, new (require(__dirname+'/runScripts.js'))(family));
    }, 3000);
  });
}).then(null, console.warn);

