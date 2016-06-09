define( function() {
   var MyClass = function(){};
   
   MyClass.prototype.render =  function($ctrl, manager, parent) {
      var self = this,
          key = $ctrl.attr('id'),
          value = $ctrl.data('value');
      
      var $text = $('<input>',{'class': 'form-control input-sm',type: 'text', value: value });
      $text.keyup(function(e){
        manager.setValue($ctrl.attr('id'), $(this).val());
        // skip arrow key
        if(e.keyCode == 13 && parent) {
                parent.close();
        }
      });
      $text.change(function(){
         manager.setValue($ctrl.attr('id'), $(this).val());
      });
      return $text;
  };
  
  MyClass.prototype.remove = function(){
    if(this.$text) {
      this.$text.remove();
    }
  };
  
  return MyClass;
});