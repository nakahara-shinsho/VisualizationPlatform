//require('../util/wrapperConsoleForLog4js.js')
var amqp = require('amqplib');
var config = require('config') ;

amqp.connect('amqp:'+ config.get('RabbitMQ.server.host')).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var fs = require('fs') ,
      gconfig = JSON.parse( fs.readFileSync(__dirname+'/config.json', 'utf8') );
      entrance = gconfig.dataPath.toString();
    var mqBackend = new (require('./utils/MqBackend'))(ch);
    mqBackend.create(entrance, require('./utils/datalist'), 'datalist', 'datalist');
  });
}).then(null, console.warn);
