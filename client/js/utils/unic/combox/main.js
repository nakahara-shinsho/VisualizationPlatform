define( function() {
   var MyClass = function(){};
   
   MyClass.prototype.render =  function($ctrl, manager, parent) {
      var self = this;
      var $combox = $('<select/>',{class: 'form-control'});
      var range = $ctrl.data('range'),
          key = $ctrl.attr('id'),
          value = $ctrl.data('value');
      range.forEach(function (item, i) {
        var $option = $("<option/>", {text: item });
        if (value == item) {
          $option.prop('selected', true);
        }
        $combox.append($option);
      });
      $combox.on("change", function (ev) {
        var $select = $(this).find("option:selected");
        manager.setValue(key, $select.val());
      });
      return $combox;
   };
   
   return MyClass;
});