define([
  'util/datetimepicker/bootstrap-datetimepicker.min',
  'css!util/datetimepicker/bootstrap-datetimepicker.min'
], function() {
   var MyClass = function(){};
   MyClass.prototype.render =  function($ctrl, manager, parent) {
      var self = this,
          key = $ctrl.attr('id'),
          $dtcontainer = $('<div/>',{style: 'position:relative'}),
          $dtpicker = $('<input/>', {type: 'text', value: $ctrl.data('value')});

      // create dateTimePicker component
      $dtpicker.datetimepicker({ format: '' });
      $dtpicker.on("blur", function (ev) {
        var dtvalue= $(this).val();
        manager.setValue(key, dtvalue);
      });
      $dtcontainer.append($dtpicker);
      return $dtcontainer;
   };
   
   return MyClass;
});