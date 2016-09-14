//require('../util/wrapperConsoleForLog4js.js')
var amqp = require('amqplib');
var config = require('config') ;
var mq_host = (config.has('RabbitMQ.server.host'))? config.get('RabbitMQ.server.host') : 'localhost',
    mq_port = (config.has('RabbitMQ.server.port'))? config.get('RabbitMQ.server.port') : 5672,
    mq_user = (config.has('RabbitMQ.server.user'))? config.get('RabbitMQ.server.user') : 'guest',
    mq_password =(config.has('RabbitMQ.server.password'))? config.get('RabbitMQ.server.password') : 'guest',
    mq_server = 'amqp://'+ mq_user+':'+mq_password + '@'+mq_host+ ':'+ mq_port;

amqp.connect(mq_server).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var fs = require('fs') ,
      gconfig = JSON.parse( fs.readFileSync(__dirname+'/config.json', 'utf8') );
      entrance = gconfig.dataPath.toString();
    var mqBackend = new (require('./utils/MqBackend'))(ch);
    mqBackend.create(entrance, require('./utils/datalist'), 'datalist', 'datalist');
  });
}).then(null, console.warn);
