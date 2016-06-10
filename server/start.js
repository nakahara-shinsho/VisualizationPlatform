
GLOBAL.config = require('config') ;
GLOBAL.mqFrontend = new (require('./stream/MqFrontend'))
  ('amqp:'+ GLOBAL.config.get('RabbitMQ.server.host'));
GLOBAL.httpServer = new(require('./stream/HttpServer'))
  (__dirname, process.env.PORT || GLOBAL.config.get('Http.server.port') || 8001);
GLOBAL.wsServer = new (require('./stream/WsServer'))
  (GLOBAL.httpServer.server);