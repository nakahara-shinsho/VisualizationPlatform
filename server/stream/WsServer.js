
var WsServer= function(server, loglevel) {
    
    this.socket = null;
    this.requestId = 0;
    this.requests = {};
    
    var that = this;
    var sio = require('socket.io').listen(
        server,
        {'log level':  loglevel || 3 }
      );//0:error 1:warn 2:info 3:debug
    
    sio.on('connection', function (socket) {
      that.socket = socket;
      socket.on('request', function (request) {
        var method = request.method,
          func = that.RPCS[method];
        if (func) {
          func(request.payload)
            .done(function (result) {
              socket.emit('response', {
                payload: result,
                requestId: request.requestId
              });
            })
            .fail(function (error) {
              socket.emit('response', {
                error: 'Calling ' + method + 'failed: ' + error,
                requestId: request.requestId
              });
            });
        } else {
          socket.emit('response', {
            error: 'Unkonwn method:' + method,
            requestId: request.requestId
          });
        }
      }); //request end
      
      sio.on('response', function (response) {
        var deferred = that.requests[response.requestId];
        if (response.error) {
          deferred.reject(response.error);
        } else {
          deferred.resolve(response.payload);
        }
        delete that.requests[response.requestId];
      }); //response end
      
      sio.on('notify', function (request) {
        var method = request.method,
          func = that.NTFS[method];
        if (func) {
          func(request.payload);
        } //if end
      }); //notify end
      
      sio.on('disconnect', function () {
        that.disconnect();
      }); //response end
      
    }); //connection end
  };//my class end
  
  
  WsServer.prototype.request = function (method, payload) {
    var that = this;
    var $ = require('jquery-deferred');
    var deferred = this.requests[this.requestId] = $.Deferred();
    if (that.socket) {
      that.socket.emit('request', {
        method: method,
        requestId: that.requestId,
        payload: payload
      });
      that.requestId = (that.requestId > 1000000) ? 0 : that.requestId + 1;//next requestId
      return deferred.promise();
    } else {
      return deferred.reject('No socket connection !').promise();
    }
  };
  
  WsServer.prototype.disconnect = function () { //donot use this assp
    if (this.socket) {
      this.socket.disconnect();
    }
    this.socket = null;
    this.requestId = 0;
    this.requests = {};
  };
  
  WsServer.prototype.notify = function (method, payload) {
    if (this.socket) {
      this.socket.emit('notify', {
        method: method,
        payload: payload
      });
    }
  };

  //here is to inplement WsServer.RPCS methods
  WsServer.prototype.RPCS = {};
  WsServer.prototype.RPCS.echo = function (payload) {
    if (payload) {
      return $.Deferred().resolve(payload).promise();
    } else {
      return $.Deferred().reject('No messsage to echo !').promise();
    }
  };
  
  /*//get virtual table list
  WsServer.prototype.RPCS.vts = function (payload) {
    if (GLOBAL.mqFrontend) {
      return $.Deferred().resolve(payload).promise();
    } else {
      return $.Deferred().reject('No messsage to echo !').promise();
    }
  };*/

  //here is to extend WsServer.NTFS methods
  WsServer.prototype.NTFS = {};
  WsServer.prototype.NTFS.log = function (payload) {
    if (payload) {
      console.log('log message: ' + JSON.stringify(payload));
    }
  };
 
module.exports = WsServer;