//require('./util/wrapperConsoleForLog4js.js');

GLOBAL.config = require('config') ;
GLOBAL.mqFrontend = new (require('./stream/MqFrontend'))
  ('amqp:'+ GLOBAL.config.get('RabbitMQ.server.host'));
console.log('PORT = ' + GLOBAL.config.get('Http.server.port'));
GLOBAL.httpServer = new(require('./stream/HttpServer'))
  (__dirname, process.env.PORT || GLOBAL.config.get('Http.server.port') || 8001);
GLOBAL.wsServer = new (require('./stream/WsServer'))
  (GLOBAL.httpServer.server);
