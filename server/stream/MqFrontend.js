
function MqFrontend(host) {
  //private members (static variables once initialized)
  var self = this;
  var uuid = require('node-uuid');
  var when = require('when');
  var requests = {};
  
  //pubic members
  this.LRUinterval = 5000;//7 seconds
  this.LRUcount = 10000;//10 seconds
  this.LRU4vts = {};
  this.vts = {
    ADVANCED: {},
    TABLE: {},
    TREE: {},
    STREAM: {}
  };
  
  setInterval(this.clearStopedVTS.bind(this), this.LRUinterval); //check and clear vts
  
  this.channel = require('amqplib').connect(host).then(function (conn) {
      return conn.createChannel();
  });
  
  
  this.aftprocess = function (ch, msg) {
    if(msg) {
      var defer = requests[msg.properties.correlationId];
        if(defer) { //request from me
          var payload = msg.content.toString('utf8');
          console.log(payload.slice(0,50));
          defer.resolve(payload);
          delete requests[msg.properties.correlationId];
          ch.ack(msg, false);
        } else { //not my messsage, return it to broker(mq)
          ch.nack(msg, false, true);
        }
    }
  };

  //publisher (rpc)
  this.request = function (wvt_name, options) { //wvt_name should be wk_name.vt_name
    var uid = uuid(); //request id
    var toBeAnswered = requests[uid] = when.defer();
    var ex = "topic_rpc";
    
    if (self.channel) {
      return self.channel.then(function (ch) { //socket between frontend <--> MQserver 
        var ok = ch.assertQueue('__rpc__.'+ wvt_name/*, {exclusive: true}*/) //response queue with routing_key
          .then(function (qok) { return qok.queue; });
        ok = ok.then(function (queue) { 
         
          return ch.consume(queue, function(msg){ self.aftprocess(ch, msg);}, {noAck: false}) //noAsk=false  will assure correct response with multiple frontend?
            .then(function () {
              return queue; 
            });
        });
        
        ok = ok.then(function (queue) {
          
          ch.assertExchange(ex, 'topic', {durable: false});
          //console.log('------------------------------'+ JSON.stringify(options));
          ch.publish(ex, wvt_name, new Buffer( (options)? JSON.stringify(options): "{}"), { //request ex + routing_key
            correlationId: uid,
            replyTo: queue,
            vt: wvt_name 
          });
          
          return toBeAnswered.promise;
        });
        return ok;
      });
    } else {
      toBeAnswered.reject('No Message Queue channel connection !');
      return toBeAnswered.promise;
    }
  };

  //get virtual table notify event
  this.channel.then(function (ch) {
    var ex = 'vt_adding';
    ch.assertExchange(ex, 'fanout', {durable: false});
    ch.assertQueue('', {exclusive: true}).then( function(qok) {
      
      ch.bindQueue(qok.queue, ex, '');
      ch.consume(qok.queue, function(recvMsg){
        //this.assert.equal('application/json', recvMsg.properties.contentType);
        //console.log('vt name=' + recvMsg.content.toString('utf8'));
        var vparam = JSON.parse(recvMsg.content);
        if(vparam.type) {
            switch (vparam.type) {
            case 'TABLE' :
              if(!self.vts.TABLE[vparam.name] ){
                self.vts.TABLE[vparam.name] = vparam.value;
              }
              break;
            case 'TREE' :
              if(!self.vts.TREE[vparam.name] ){
                self.vts.TREE[vparam.name] = vparam.value;
              }
              break;
            case 'STREAM':
              if(!self.vts.STREAM[vparam.name]){
                self.vts.STREAM[vparam.name]=vparam.value;
              }
              break;
            default :
              if(self.vts.ADVANCED[vparam.type]) {
                if(self.vts.ADVANCED[vparam.type].indexOf(vparam.name)){
                    self.vts.ADVANCED[vparam.type].push(vparam.name);
                }
              } else {
                self.vts.ADVANCED[vparam.type]=[vparam.name]; //vparam.value is not used for ADAVANCED
              }
              break;
            } //switch end 
            self.LRU4vts[vparam.name] = new Date();
        }
      }, {noAck: true});
    });
  });
}

MqFrontend.prototype.registerUpdatingDataCB = function (callback) {
  var that = this;
  that.channel.then(function (ch) {
    var qname = 'data_updating';
    var ok = ch.assertQueue(qname, {durable: false});
    ok = ok.then(function (qok) {
      return ch.consume(qname, callback, {noAck: true});
    });
  });
};

//send logMessage notify event
MqFrontend.prototype.notify = function (severity, payload) {
  var that = this;
  var exname = 'log';
  if (that.channel) {
    that.channel.then(function (ch){
      ch.assertExchange(exname, 'topic')
        .then(function(){
          ch.publish(exname, severity, payload);
        });
    });
  }
};

MqFrontend.prototype.clearStopedVTS = function () {
  var self  = this, 
      index = -1, 
      currentDate = new Date();
  
  Object.keys(this.LRU4vts).forEach( function(wkname) {
      if((currentDate - self.LRU4vts[wkname]) > self.LRUcount) {
          if(self.vts.TABLE[wkname]) {
              delete self.vts.TABLE[wkname];
          } else 
          if(self.vts.TREE[wkname]) {
              delete self.vts.TREE[wkname];
          } else 
          if(self.vts.STREAM[wkname]) {
              delete self.vts.STREAM[wkname];
          }
          else {
             Object.keys(self.vts.ADVANCED).forEach(function(chartType){
               if( (index=self.vts.ADVANCED[chartType].indexOf(wkname)) >=0) {
                  self.vts.ADVANCED[chartType].splice(index, 1);
                  if(self.vts.ADVANCED[chartType].length ===0) {
                      delete self.vts.ADVANCED[chartType];
                  }
               }
             });
          } //ADVANCED end
          delete self.LRU4vts[wkname];
      } //delete by LRU conditions
  });
};

module.exports =  MqFrontend;
