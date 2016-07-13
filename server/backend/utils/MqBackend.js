module.exports = MqBackend;

function MqBackend(ch) {
  var self = this;
  
  this.requestQueueList ={};
  
  this.starts = function(chart_type, entrance, org_wk_names, prepare_data_callback) {
    
    org_wk_names.forEach(function(org_wk_name) {  
      var wk_name = org_wk_name.replace(/\./g, '_');
      
      if(chart_type) { //notify and show on client screen
        self.notify(chart_type, wk_name, prepare_data_callback.vts(wk_name));
      }
      if(!self.requestQueueList[wk_name]) {
        self.create(entrance, prepare_data_callback, wk_name, org_wk_name); //file as worker name
      }
    });//for end
  };
  
  // nofifier
  this.notify = function(chart_type, wk_name, vts) {
     var ex =  'vt_adding',
         payload = {type: chart_type,  name: wk_name, value:vts};
     ch.assertExchange(ex, 'fanout', {durable: false});
     ch.publish(ex, '', new Buffer(JSON.stringify(payload)), {contentType: 'application/json'});
  };
  
  //wk_name is the name to difficiate workers, org_wk_name is the name to be used for querying data 
  this.create = function(entrance, prepare_data_callback, wk_name, org_wk_name) {
      //receive
      ch.assertExchange('topic_rpc', 'topic', {durable: false});
      ch.assertQueue('', {exclusive: true}).then(function(qok) {
        //console.log('------------------- queue name['+ wk_name +']= '+ qok.queue);

        self.requestQueueList[wk_name] = qok.queue;
        ch.bindQueue(qok.queue, 'topic_rpc', wk_name +'.#'); //wk_name.vt_name
        return ch.consume(qok.queue, function(msg) {
            self.reply(msg, entrance, prepare_data_callback, org_wk_name);
         }, {noAck: true});
    });
  };
  
  this.reply = function(msg, entrance, prepare_data_callback, org_wk_name) {

    if(msg && msg.content) { //delete a file will trigger reply with null of msg
       
      if(prepare_data_callback.syn) {
        var jsondata = prepare_data_callback.syn(JSON.parse(msg.content.toString()), entrance, org_wk_name);
        ch.sendToQueue(msg.properties.replyTo,
              new Buffer(JSON.stringify(jsondata)), {correlationId: msg.properties.correlationId} );
        console.log(JSON.stringify(jsondata).slice(0,50));

      } else if(prepare_data_callback.asyn) {
        prepare_data_callback.asyn(JSON.parse(msg.content.toString()), entrance, org_wk_name)

         .always(function(jsondata) {
            ch.sendToQueue(msg.properties.replyTo,
               new Buffer(JSON.stringify(jsondata)),{correlationId: msg.properties.correlationId});
               console.log(JSON.stringify(jsondata).slice(0, 50));
          });
      }
      
      if(prepare_data_callback.clear) { //clear status
        prepare_data_callback.clear();
      }
    }
  };
}
