describe('servers connecttion test', function () {
  it("http server responds connection test", function (done) {
    var request = require('request');
    request("http://localhost:8001", function (error, response, body) {
      expect(response.statusCode).toEqual(200);
      done();
    });
  }, 1000);

  it("websocket server connection test", function (done) {
    var socket = require('socket.io-client')('http://localhost:8001', {'forceNew': true });
    socket.on('connect', function () {
      socket.disconnect();
      expect(true).toEqual(true);
      done();
    });
  }, 1000);

  it("amqp server connection test", function (done) {
    require('amqplib').connect('amqp://133.196.11.23')
      .then(function (conn) {
        expect(true).toEqual(true);
        done();
      });
  }, 1000);
});