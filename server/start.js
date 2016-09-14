require('./util/wrapperConsoleForLog4js.js');
GLOBAL.config = require('config') ;

var mq_host = (GLOBAL.config.has('RabbitMQ.server.host'))? GLOBAL.config.get('RabbitMQ.server.host') : 'localhost',
    mq_port = (GLOBAL.config.has('RabbitMQ.server.port'))? GLOBAL.config.get('RabbitMQ.server.port') : 5672,
    mq_user = (GLOBAL.config.has('RabbitMQ.server.user'))? GLOBAL.config.get('RabbitMQ.server.user') : 'guest',
    mq_password =(GLOBAL.config.has('RabbitMQ.server.password'))? GLOBAL.config.get('RabbitMQ.server.password') : 'guest',
    mq_server = 'amqp://'+ mq_user+':'+mq_password + '@'+mq_host+ ':'+ mq_port;
var http_port = (GLOBAL.config.has('Http.server.port'))? GLOBAL.config.get('Http.server.port') : 8001;

GLOBAL.mqFrontend = new (require('./stream/MqFrontend'))(mq_server);

console.log('PORT = ' + http_port);
GLOBAL.httpServer = new(require('./stream/HttpServer')) (__dirname, process.env.PORT || http_port );

GLOBAL.wsServer = new (require('./stream/WsServer'))(GLOBAL.httpServer.server);
