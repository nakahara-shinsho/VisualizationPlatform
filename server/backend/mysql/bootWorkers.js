
var amqp    = require('amqplib');
var config  = require('config');
var fs      = require('fs');
var pathLib = require('path');
var gconfig = JSON.parse( fs.readFileSync(__dirname+'/../config.json', 'utf8') );
var entrance = gconfig.dataPath.toString();
console.log("[INFO] :: Boot MySQL Workers");
console.log("[INFO] :: *Warning* bootWorkers.js does not check data schema");

function collector (path) {
  var exec          = require('child_process').execSync;
  var StringDecoder = require('string_decoder').StringDecoder;
  var decoder       = new StringDecoder('UTF-8');

  var files = [];
  /*********************
   * Get Virtual Table *
   *********************/
  var virtualTables = []; // {"vtname" : vtname, "columns": [columname]}
  getVirtualTables();
  console.log("[INFO] :: GET VirtualTable for MySQL ");
  virtualTables.forEach(function(vtname){
    console.log("[INFO] :: VT [" + vtname + "]");
  });
  function getVirtualTables(){
    var vts   = fs.readdirSync(__dirname+"/VirtualTable/");
    for(var i=0; i<vts.length; i++){
      if(vts[i].indexOf(".json") !== -1 &&
         vts[i].indexOf(".json~") === -1){
        virtualTables.push(vts[i].replace(".json",""));
      }
    }
  }
  return virtualTables;
}

amqp.connect('amqp:'+ config.get('RabbitMQ.server.host')).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var mqBackend = new (require('../utils/MqBackend'))(ch);
    setInterval(function(){
      var family  = collector(entrance);
      mqBackend.starts('TABLE', entrance, family, new (require(__dirname+'/mysqlUtils.js'))(family));
    }, 5000);
  });
}).then(null, console.warn);

