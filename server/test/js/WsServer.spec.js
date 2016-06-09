describe('websocket RPC tests', function () {
  
  var client, resps;
  
  beforeEach(function () {
    client = new (require('../../js/WsServerHelper'))('http://localhost:8001', {'forceNew':true });
    resps = '';
   });
  
  afterEach(function(){
    client.disconnect();
   });
   
  it("websocket  echo with null", function(done) {
      
      client.request('echo')
        .then(function(result){
          }, function(err) { 
            resps = err;  
          })
         .always( function(){
            expect(resps).toMatch(/No messsage to echo/);
            done();  
          });  
   }, 1000);
  
  it("websocket echo with string", function(done) {
      client.request('echo',  'hello websocket!')
        .then(function(result){ resps = result;}, 
              function(err){}
          )
         .always( function(){
            expect(resps).toEqual('hello websocket!');
            done();  
          });  
   }, 1000);
});

describe('websocket NOTIFY tests', function(){
   //how to check the server payload value ?
   var client = new (require('../../js/WsServerHelper'))('http://localhost:8001', {'forceNew':true });
   
   it("websocket server log method", function() {
      client.notify('log', {data: 'here is a test', name: 'test'});
      expect(true).toEqual(true); 
    });
});
