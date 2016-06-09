define([
  'util/colorpicker/bootstrap-colorpicker',
  'css!util/colorpicker/bootstrap-colorpicker.min'
], function() {
   var MyClass = function(){ };
  
   MyClass.prototype.render =  function($ctrl, manager, parent) {
      var self = this,
          key = $ctrl.attr('id'),
          value = $ctrl.data('value');
      var $input = $('<input/>',{class:'form-control',type:'text', value: value}),
          $span  = $("<span class='input-group-addon' />")
                    .append('<i id="colorPickerIcon">'),
          $color = $("<div class='input-group' />")
                    .append($input)
                    .append($span);
      $color.colorpicker();
      // trigger event when change color of colorPicker
      $color.on('changeColor.colorpicker', function (ev) {
        var color = $(this).find("input").val();
        manager.setValue($ctrl.attr('id') ,color);
      });
      return $color;
  };
  
  MyClass.prototype.remove = function(){
     $(document.body).find('.colorpicker').remove();
  };
  
  return MyClass;
});