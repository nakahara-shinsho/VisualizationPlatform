define( function() {
   var MyClass = function(){};
  
   MyClass.prototype.render =  function($ctrl, manager, parent) {
      var self = this, id=$ctrl.attr('id');
      
      var $selection = $('<select />',{  class:'form-control', multiple:'multiple' });
      var range = $ctrl.data('range'),
          values = $ctrl.data('value');
      if(!range) range = [];
      
      // add option to selection
      range.forEach(function (item, i) {
        var $option = $("<option/>", {text: item });
        if (values.includes(item)) {
          $option.prop('selected', true);
        }
        $selection.append($option);
      });
      
      $selection.on('change', function(ev){
        var selects = [];
        $(this).find("option:selected").each(function(i, $item){
          selects.push ($item.text);
        });
        if(id){
            manager.setValue(id, selects);
        } else {
            manager.setValue(selects); //columns selector
        }
      });
      
      return $selection;
  };
  
  MyClass.prototype.remove = function(){
    if(this.$text) {
      this.$text.remove();
    }
  };
  
  return MyClass;
});