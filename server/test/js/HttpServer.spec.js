
describe("http server details test", function　() {
  var request = require('request');
  it("can the http server module is test separately?", function　(done) {
    request("http://localhost:8001", function　(error, response, body)　{
      expect(response.statusCode).toEqual(200);
      done();
    });
  }, 1000);
});