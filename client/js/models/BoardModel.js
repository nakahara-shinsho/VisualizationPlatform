//here to keep data for one chart widget
define( function () {
  var MyClass = Backbone.Model.extend({
    urlRoot: 'api/chart',
    defaults: {},
    initialize: function () {
      //this.memento = new Backbone.Memento(this, { ignore: ['import','export']});
      this.bind('change', function(){
        //var params = $.extend({}, this.changedAttributes(), _.pick(this.attributes, 'id') );
        //this.save(params, {patch: true});
        this.save(null, {patch: true}); //is this correct?
      });//if error, undo it?
    },
    
    //to unify the IF of updating from unit control component
    setValue: function(key, val) {
        this.set(key, val);
    }
  });
  
  return MyClass;
});