
var amqp   = require('amqplib');
var config = require('config');
var fs     = require('fs');
//var entrance = __dirname;
var entrance = __dirname+"/sample/";
function collector (path) {
  var files = [];
  var list  = fs.readdirSync(path); //get all contents under path
  var vts   = fs.readdirSync(path+"/../VirtualTable/");
  var virtualTables = [];
  for(var i=0; i<vts.length; i++){
    if(vts[i].indexOf(".json.template") !== -1){
      virtualTables.push(vts[i].replace(".json.template",""));
    }
  }
  for(i=0; i<list.length; i++){
    var fullPath = path + "/" +list[i];
    try{
      var st     = fs.statSync(fullPath);
      var fileinfo = list[i].split(".");
      if(st.isFile() && fileinfo.length === 2){
        if(fileinfo[1].toLowerCase() ==='db'){
          virtualTables.forEach(function(vt){
            files.push(vt+"::"+fileinfo[0]);
          });
        }
      }
    } catch(e) {
      console.log("error:"+e.message);
    }
  }
  return files;
}

amqp.connect('amqp:'+ config.get('RabbitMQ.server.host')).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var mqBackend = new (require('../utils/MqBackend'))(ch);
    setInterval(function(){
      var family  = collector(entrance);
      mqBackend.starts('TABLE', entrance, family, new (require('../utils/PDB.js'))(family));
    }, 3000);
  });
}).then(null, console.warn);

