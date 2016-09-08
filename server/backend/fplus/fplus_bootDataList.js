
require('../util/wrapperConsoleForLog4js.js');
var amqp   = require('amqplib');
var config = require('config') ;

amqp.connect('amqp:'+ config.get('RabbitMQ.server.host')).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var entrance = "";
    var mqBackend = new (require('./utils/MqBackend'))(ch);
    mqBackend.create(entrance, require('./fplus_datalist'), 'datalist', 'datalist');
  });
}).then(null, console.warn);

