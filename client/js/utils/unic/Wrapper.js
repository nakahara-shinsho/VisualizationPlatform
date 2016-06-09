define([
	'util/jquery.ba-outside-events',
	'lib/jquery-ui/jquery-ui',
	'css!lib/jquery-ui/jquery-ui.css'
 ], function(){
  
  var MyClass = function(){
    this.$el = $('<div class="content">').css('overflow','visible');
  };
  
  MyClass.prototype.dialog = function($ctrl_content, $location, manager) {
    var self = this;
    
    if(this.$el.children().length >0 ) {
      this.close();
    }
    
    this.$el.append($ctrl_content);
    
    this.$el.dialog({
      modal: false,
      draggable: false,
      resizable: true,
      closeOnEscape: true,
      minHeight: 0,
      position: {
        of: $location
      },
      close: function() { //ESC
        self.close();
      }
    }).parent().draggable();
    
    $(".ui-dialog-titlebar").remove();
    this.$el.bind('clickoutside dblclickoutside /*focusout*/', function() { 
      if($(".ui-dialog").is(":visible")){
        self.close();
      }
     });
    
  };
  
  MyClass.prototype.show = function($tpl, $location, manager){
    var self = this, unic=null;
    switch($tpl.data('type')) {
      case 'slider':
        unic = 'util/unic/slider/main';
        break;
      case 'text':
        unic = 'util/unic/text/main';
        break;
      case 'multi-ranges-silder':
        unic = 'util/unic/multiRangesSlider/main';
        break;
      default:
        break;
      }
      if(unic) {
        require([unic], function(CtrlLib){
          $ctrl_content= (new CtrlLib()).render($tpl, manager, self);
          self.dialog($ctrl_content, $location);
        });
      }
  };
  
  MyClass.prototype.close = function() {
      this.$el.dialog('close');
      this.$el.empty();
  };
  
  return new MyClass();
  
});