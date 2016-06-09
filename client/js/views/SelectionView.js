define(['lib/jquery-ui/jquery-ui',
        'css!lib/jquery-ui/jquery-ui.css'
       ], function() {
  
  var MyClass = function(){
  };
  
  MyClass.prototype.show = function(items, $location) {
    
    var deferred = $.Deferred();
    
    //create selections
    var $container =$('<div class="content">');
    var $selection = $('<select />',{  class:'form-control'}).attr('size', items.length).appendTo($container);
    
    // add option to selection
    items.forEach(function (item, i) {
        var $option = $("<option/>", {text: item });
        $selection.append($option);
      });
    
    //create dislog
    $container.dialog({
      modal: true,
      draggable: false,
      resizable: false,
      autoOpen: false,
      title: 'Please select The next SCREEN...',
      closeOnEscape:	true,
      minHeight: 0,
      position: {
        of: $location
      },
      close: function() { //ESC
        $container.dialog('destroy');
        deferred.reject();
      }
    }).parent().draggable();
    $(".ui-dialog-titlebar").remove();
    
    //add selection event callback
    $selection.on('change', function(ev){
        var selected = $(this).find("option:selected").first().text();
        $container.dialog('destroy');
        deferred.resolve(selected);//close and return selected items 
      });
    
    //open dialog
    $container.dialog('open');
    
    return deferred.promise();
  };
  
  return MyClass;
  
});