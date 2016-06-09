var amqp = require('amqplib'),
      config = require('config'),
      fs = require('fs');
var entrance = __dirname+'/bigdata/',
    callback = new (require('./utils/ReadFile4Bigdata.js'))();

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
    collector(entrance).forEach(function(wk_name) {
      setInterval(function(){
        mqBackend.notify('TABLE', wk_name, callback.vts(wk_name));
      }, 3000);
      mqBackend.create(entrance, wk_name, callback.init(entrance,wk_name));            
    });        
  });
}).then(null, console.warn);
