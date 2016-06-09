describe('amqp server details test', function　()　{
  var MqServer = require('../../js/MqServer');
  var mqServer = new MqServer('amqp://133.196.11.23');

  it("request test", function (done) {
    mqServer.request('echo', new Buffer('hello mq!')).done(function (data) {
      expect(data).toEqual('hello mq!');
      done();
    },　function　(err)　{
      expect(err).toEqual('hello');
      done();
    });
  }, 2000);
  xit("consume test", function　(done) {
    mqServer.consume('test', function　(msg)　{
      this.ack(msg);
      expect(msg.content.toString()).toEqual('hello mq!');
      done();
    });
  }, 1000);
});