define( function() {
   var MyClass = function(){};
   
   MyClass.prototype.render =  function($ctrl, manager, parent) {
      var self = this;
      var $checks = $("<div/>");
      var range = $ctrl.data('range'),
          key = $ctrl.attr('id'),
          values = $ctrl.data('value');
      range.forEach(function (item, i) {
        var $checkbox = $("<input />", {type: 'checkbox', name: key, value: item }),
            $label = $("<label />");
        if (Object.prototype.toString.call(values) === '[object Array]' && values.includes(item)) {
          $checkbox.prop('checked', true);
        }
        $checkbox.on("click", function (ev) {
          var checks = [],  $checked = $checks.find("input:checked");
          $checked.each(function(){
            checks.push($(this).val());
          });
          manager.setValue(key, checks);
        });
        $checks.append($label.append($checkbox).append(item));
      });
      return $checks;
   };
   
   return MyClass;
});