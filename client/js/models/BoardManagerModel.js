define( function () {
  var MyClass = Backbone.Model.extend({
    urlRoot: '/api/screen',
    /*defaults: {
      maxRows: 5,
      margin: 5,
      maxColumns: 2,
      cells: {},
      description: '',
      imgurl: ''
      //uer and id will be initialized with parameters
    },*/
    
    initialize: function (attributes, options) {
      if(options.screenid){
        this.set('id', options.screenid);
      }
      this.bind('change', function(){
        //trigger router with :/id, retrive data with the two parameters
        var params =$.extend({}, this.changedAttributes(),
                             _.pick(this.attributes, 'user', 'id'));
        this.save(params);
      });//if error, undo it?
    }, //initialize end

    //save and then fetch
    //thisid and newid can be null,
    //if(!this.id)&&(!newid), normal new func --id="xxxxxxxxx", the newest one: /api/screen
    //delete: if(!this.id)&&(newid), normal new func, with specificed id --id="newid" :api/screen?newid=newid
    //if (this.id) && (!newid), nomal save func, --id="this.id":/api/screen/id
    //delete: if (this.id) && (newid),  nomal save func, update id in server --id="newid":/api/screen/id?newid=newid
    //a screen id must be checked by server in advance or silently generated by server
    syncMe: function (newid){
      var self = this;
      var deferred = $.Deferred();
      var fetch_params = {
          silent: true, //don't trigger change event to furtherly save model
          error: function(model, xhr, options) {
            console.log(xhr.responseText);
            self.save(null, {
              silent: true, //do not trigger change event to furtherly save model
              success: function (model, response, options){
                deferred.resolve(model); //curiously resolveWith can not be used.
              },
              error: function(model, xhr, options){
                deferred.reject(xhr.responseText);
              }
            });//save end
          },
          success: function(model, response, options){
            if(model.has(0)){
                model.set(model.get(0), {silent: true});
                model.unset(0, {silent: true});
            }
            deferred.resolve(model);
          }
        };
       
        //user (and/or id) is the necessary parmeters 
        $.extend(fetch_params, {data: _.pick(this.attributes, 'user') });

        this.fetch(fetch_params);//fetch end
      
      return deferred.promise();
    },
    
    //this function should not be here.
    //clone existed model, clone2id can be null, if null, the id will be generated in server
    //if (this.id) && (clone2id), copy
    //cloneMe: function(clone2id){
    //}
    
  });//MyClass
  return MyClass;
});