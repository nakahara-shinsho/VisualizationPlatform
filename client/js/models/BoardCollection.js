//here to keep data for one chart widget
define(['model/BoardModel'], function (BoardModel) {
  
  var myclass = Backbone.Collection.extend({
    
    model: BoardModel,
    
    lookupModel: function (id) {
      var self = this;
      var deferred = $.Deferred();
      
      var model = this.get(id);
      if ( model) { //exists in memory model
        deferred.resolve(model);
      } else {
        model = new BoardModel( {id: id} );
        model.fetch({
          silent: true, //do not trigger change event to furtherly save model
          success: function (modelInDB){
            //self.add(modelInDB); //add to collection
            deferred.resolve(modelInDB); //curiously resolveWith can not be used.
          },
          error: function(modelInDB, xhr, options){
            deferred.reject(xhr.responseText);
          },
          complete: function(){
            self.add(model);
            deferred.resolve(model);
          }
        });
      }
      return deferred.promise();
    }, //loolup end

    //create new Model: the options should include userid, screenid, vtname, vttype
    newModel: function(options){
      var self = this;
      var deferred = $.Deferred();
      var model = new BoardModel(options);
      model.save(null, {
        silent: true, //donot trigger change event to furtherly save model
        error: function(modelInDB, xhr, options) {
          deferred.reject(xhr.responseText);
        },
        success: function(modelInDB){
          self.add(modelInDB);
          deferred.resolve(modelInDB);
        }
      });
      return deferred.promise();
    },
    
    removeModel: function(model){
      var self = this;
      var deferred = $.Deferred();
      model.destroy({
        silent: true,
        error: function(mod, xhr, options) {
          deferred.reject(xhr.responseText);
        },
        success: function(mod){
          self.remove(mod);
          deferred.resolve();
        }
      });
      return deferred.promise();
    } //removeModel end
  });
  return myclass;
});