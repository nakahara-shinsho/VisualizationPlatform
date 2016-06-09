define(['js/app'], function(app){
  
    var MyClass = Backbone.Model.extend({
        urlRoot: '/api/tool',
        defaults: {
          graph: {},
          format: ''
        },
      
        parse: function(response) {
          if(response.graph && typeof response.graph !=='object'){
            response.graph = JSON.parse(response.graph);
          }
          return response;
        },
      
        initialize: function(){
        },
    });
   
    return MyClass;
});
