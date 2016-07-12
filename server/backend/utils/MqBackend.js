module.exports = MqBackend;
var sqlite_tool = new (require('../sqlite/sqlite_tool.js'))();
var queryTool = new (require('../sqlite/queryTool.js'))();
//TBD: use 'topic' to improve flexibility
function MqBackend(ch) {
  var self = this;
  
  this.requestQueueList ={};
  
  this.starts = function(chart_type, entrance, wk_names, prepare_data_callback) {
    /*Object.keys(this.requestQueueList).forEach(function(wk_name){
      if(wk_names.indexOf(wk_name) <0) {
          //ch.unbindQueue(self.requestQueueList[wk_name],'topic_rpc', wk_name +'.#');
          //ch.deleteQueue(self.requestQueueList[wk_name]); //request queue: left them for furtherly using
          //ch.deleteQueue('__rpc__.'+ wvk_name); //response queue: left them for furtherly using ?
          delete self.requestQueueList[wk_name];
        }
    });
    */
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
      }
    });
  };
  
  // nofifier
  this.notify = function(chart_type, wk_name, vts) {
     var ex =  'vt_adding',
         payload = {type: chart_type,  name: wk_name, value:vts};  
     ch.assertExchange(ex, 'fanout', {durable: false});
     ch.publish(ex, '', new Buffer(JSON.stringify(payload)), {contentType: 'application/json'});
  };
  
  // worker
  this.create = function(entrance, wk_name, prepare_data_callback, query) {
      //receive
      ch.assertExchange('topic_rpc', 'topic', {durable: false});
      ch.assertQueue('', {exclusive: true}).then(function(qok) {
        //console.log('------------------- queue name['+ wk_name +']= '+ qok.queue);
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
    if(msg && msg.content) { //delete a file will trigger reply with null of msg
       
      if(prepare_data_callback.syn) {
        var jsondata = prepare_data_callback.syn(JSON.parse(msg.content.toString()), entrance, wk_name);
        ch.sendToQueue(msg.properties.replyTo,
              new Buffer(JSON.stringify(jsondata)), {correlationId: msg.properties.correlationId} );
        console.log(JSON.stringify(jsondata).slice(0,50));
      } else if(prepare_data_callback.asyn) {	  
	  prepare_data_callback.asyn(JSON.parse(msg.content.toString()), entrance, wk_name, query)
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
