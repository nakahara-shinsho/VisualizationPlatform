define( function() {
   var MyClass = function(){};
   
   MyClass.prototype.render =  function($ctrl, manager, parent) {
      var self = this;
      var $radios = $("<div/>");
      var range = $ctrl.data('range'),
          key = $ctrl.attr('id'),
          value = $ctrl.data('value');
      range.forEach(function (item, i) {
        var $radio = $("<input />", {type: 'radio', name:key, value: item }),
            $label = $("<label />");
        if (value == item) {
          $radio.prop('checked', true);
        }
        $radio.on("click", function (ev) {
          var $target = $(this);
          manager.setValue(key, $target.val());
        });
        $radios.append($label.append($radio).append(item));
      });
      return $radios;
   };
   
   return MyClass;
});