define(['js/app'], function(app){
  
    var MyClass = Backbone.Model.extend({
        urlRoot: '/api/status',
        defaults: {
          tool: {},
          data: {},
          //screenid: to keep and resore the current screen
        },
      
        parse: function(response) {
          if(response.tool && typeof response.tool !=='object'){
            response.tool = JSON.parse(response.tool);
          }
          if(response.data && typeof response.data !=='object'){
            response.data = JSON.parse(response.data);
          }
          return response;
        },
      
        initialize: function(){
          //window.framework.context = 
          //  {_format_: this.get('data').format, _database_:this.get('data').id};
          
          this.bind('change', function(){
            if(this.hasChanged('data')) {
              var data = this.get('data');
              window.framework.context = {_format_: data.format, _database_: data.id};
            }
            this.save(this.attributes, {silent: true});
          });
        },
    });
   
    return MyClass;
});

