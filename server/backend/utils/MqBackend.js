module.exports = MqBackend;
var sqlite_tool = new (require('../sqlite/sqlite_tool.js'))();
var queryTool = new (require('../sqlite/queryTool.js'))();
//TBD: use 'topic' to improve flexibility
function MqBackend(ch) {
  var self = this;
  
  this.requestQueueList ={};
  
  this.starts = function(chart_type, entrance, file_names, prepare_data_callback) {
    
    file_names.forEach(function(file_name) {  
      var wk_name = file_name.replace(/\./g, '_');
      
      if(chart_type) { //notify and show on client screen
        self.notify(chart_type, wk_name, prepare_data_callback.vts(wk_name));
      }
      if(!self.requestQueueList[wk_name]) {
        self.create(entrance, prepare_data_callback, wk_name, file_name); //file as worker name

/*
  this.starts = function(chart_type, entrance, wk_names, prepare_data_callback) {

    wk_names.forEach(function(wk_name) {  
      if(!self.requestQueueList[wk_name]) {

        if (sqlite_tool.isDb(wk_name)) {
            //worker for sqlite
            var schemaObj = sqlite_tool.getSchemaObject(entrance, wk_name);
            Object.keys(schemaObj).forEach(function(key) {
              var queries = queryTool.getMatchedQueriesFromSchema(key, schemaObj[key]);
              queries.forEach(function (query) {
                var newName =  wk_name + "(" + query + ")";
                if(chart_type) {
              self.notify(chart_type, newName, prepare_data_callback.vts(newName));
                }
                self.create(entrance, wk_name, prepare_data_callback, query);
            });
          });
        } else {
            if(chart_type) { //notify and show on client screen
          self.notify(chart_type, wk_name, prepare_data_callback.vts(wk_name));
            }
            self.create(entrance, wk_name, prepare_data_callback); //file as worker name	  
        }
*/
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
  
  // worker
  this.create = function(entrance, prepare_data_callback, wk_name, file_name) {
      //receive
      ch.assertExchange('topic_rpc', 'topic', {durable: false});
      ch.assertQueue('', {exclusive: true}).then(function(qok) {
        //console.log('------------------- queue name['+ wk_name +']= '+ qok.queue);

        self.requestQueueList[wk_name] = qok.queue;
        ch.bindQueue(qok.queue, 'topic_rpc', wk_name +'.#'); //wk_name.vt_name
        return ch.consume(qok.queue, function(msg) {
            self.reply(msg, entrance, prepare_data_callback, file_name);
         }, {noAck: true});
    });
  };
  
  this.reply = function(msg, entrance, prepare_data_callback, file_name) {
/*
       if (query != undefined) {
		  var newName =  wk_name + "(" + query + ")";
		  self.requestQueueList[newName] = qok.queue;
		  ch.bindQueue(qok.queue, 'topic_rpc', newName +'.#'); //wk_name.vt_name
       } else {
		  self.requestQueueList[wk_name] = qok.queue;
		  ch.bindQueue(qok.queue, 'topic_rpc', wk_name +'.#'); //wk_name.vt_name
	}
        return ch.consume(qok.queue, function(msg){
                self.reply(msg, entrance, wk_name, prepare_data_callback, query);
         }, {noAck: true});
    });
  };
   
  this.reply = function(msg, entrance, wk_name, prepare_data_callback, query) {
*/
    if(msg && msg.content) { //delete a file will trigger reply with null of msg
       
      if(prepare_data_callback.syn) {
        var jsondata = prepare_data_callback.syn(JSON.parse(msg.content.toString()), entrance, file_name);
        ch.sendToQueue(msg.properties.replyTo,
              new Buffer(JSON.stringify(jsondata)), {correlationId: msg.properties.correlationId} );
        console.log(JSON.stringify(jsondata).slice(0,50));

      } else if(prepare_data_callback.asyn) {
        prepare_data_callback.asyn(JSON.parse(msg.content.toString()), entrance, file_name)

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
