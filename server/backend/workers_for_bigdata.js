//require('./util/wrapperConsoleForLog4js.js');
var amqp = require('amqplib'),
      config = require('config'),
      fs = require('fs');
var entrance = __dirname+'/bigdata/',
    ReadFileClass = require('./utils/ReadFile4Bigdata.js'); 

function collector (path) {
    var files = [];
    var list = fs.readdirSync(path); //get all contents under path
    for(var i=0; i<list.length; i++){
      var fullPath = path + list[i];
      try{
        var st = fs.statSync(fullPath);
        if(st.isFile()){
          var ext = list[i].split('.').pop().toLowerCase();
          if(ext==='csv' || ext==='tsv') {
            files.push(list[i]);
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
    var mqBackend = new (require('./utils/MqBackend'))(ch);
    collector(entrance).forEach(function(file_name) {

      var wk_name = file_name.replace(/\./g, '_'),
          instance = new ReadFileClass(entrance, file_name);
      setInterval(function(){
        mqBackend.notify('TABLE', wk_name, instance.vts(wk_name));
      }, 3000);
      mqBackend.create(entrance, instance, wk_name, file_name);
    });
  });
}).then(null, console.warn);
