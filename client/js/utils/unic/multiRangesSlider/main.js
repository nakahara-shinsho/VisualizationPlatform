define(['./jquery.limitslider','css!./ranges.css'], function() {
   var RangesView = function(){
       
   };
  
   RangesView.prototype.drawSlider = function(ioctrl) {
     var self = this,
          colorManager = ioctrl.colorManager(),
          separator = colorManager.getSeparator(),
          colormap = colorManager.getColormap(),
          domain = colorManager.getDomain();
 
      var values = [], colors=[],
          $slider = $('<div>',{id: 'slider', class: 'color-ranges'});
          
      separator.forEach(function(currSepValue){
        values.push( Math.floor(currSepValue*100) );
      });
      
      for(var i=1; i<domain.length; i++) {
        colors.push({'background': [colormap[domain[i-1]], colormap[domain[i]]]});
      }
      
      this.slider= $slider.limitslider({
          values: values,
          gap: 0,
          step : 2,
          label: function(value, index){
              if(value) {
                 return value+'%';
              } 
              return '';
          },
          stop: function(event, ui){
            if(ui.values) {
                var separator = [];
                ui.values.forEach(function(value){
                    separator.push(value/100); 
                });
                framework.mediator.trigger('color_mapping:update_separator', separator);
            }
          },
          ranges: colors
      });
      
      if(values.length <= 0) {
        this.slider.find('.ui-slider-handle').remove();
      }
      
      return $slider;
   };
  
   RangesView.prototype.render =  function($ctrl, ioctrl, parent) {
      
      var $plus = $("<div class='color-plus'> + </div>"),
          $minus = $("<div class='color-minus'> - </div>");
      
      this.$container = $('<div/>');
      
      this.drawSlider(ioctrl).appendTo(this.$container);
          $plus.appendTo(this.$container);     
          $minus.appendTo(this.$container);
      return this.$container;
  };
 
  RangesView.prototype.remove = function(){
    
    if(this.$container) {
      this.$container.remove();
    }
  };
  
  return RangesView;
});