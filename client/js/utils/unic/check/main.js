define( function() {
   var MyClass = function(){};
   
   MyClass.prototype.render =  function($ctrl, manager, parent) {
      var self = this;
      var $checkbox = $("<input />", {type: 'checkbox', value: $ctrl.data('value') }),
          $label = $("<label />");
      if ( $ctrl.data('value') ) {
        $checkbox.prop('checked', true);
      }
      $checkbox.on("click", function (ev) {
        var $target= $(ev.target);
        manager.setValue($ctrl.attr('id'), $target.prop('checked'));
      });
      return $label.append($checkbox).append($ctrl.data('name'));
   };
   
   return MyClass;
});