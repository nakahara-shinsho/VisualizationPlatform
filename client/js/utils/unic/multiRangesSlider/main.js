define(['./jquery.limitslider','css!./ranges.css'], function() {
   var RangesView = function(){
       
   };
  
   RangesView.prototype.drawSlider = function(manager) {
     var self = this,
          colorManager = manager,
          separator = colorManager.getSeparator(),
          colormap = colorManager.getColormap(),
          domain = colorManager.getDomain();
 
      var index, values = [], colors=[],
          $slider = $('<div>',{id: 'slider', class: 'color-ranges'});
          colorTransform = d3.scale.linear()
            .domain(separator)
            .range(["red", "white", "green"]);

     /* separator.forEach(function(currSepValue){
        values.push( Math.floor(currSepValue*100) );
        colors.push({'background': [colormap[domain[0]], colormap[domain[1]]]});
      });
     */

      for(index=0; index<separator.length; index++) {
        values.push( Math.floor(separator[index]*100) );
      }
      
      for(index=0; index< _.values(colormap).length; index++) {
        colors.push({'background': [ colormap[index], colormap[index+1] ]});
      }
     
      this.slider= $slider.limitslider({
          values: values,
          ranges: colors,
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
          }
      });
      
      if(values.length <= 0) {
        this.slider.find('.ui-slider-handle').remove();
      }
      
      return $slider;
   };
  
   RangesView.prototype.render =  function($ctrl, manager, parent) {
      
     // var $plus = $("<div class='color-plus'> + </div>"),
     //     $minus = $("<div class='color-minus'> - </div>");
      
      this.$container = $('<div/>');
      
      this.drawSlider(manager).appendTo(this.$container);
     //     $plus.appendTo(this.$container);     
     //     $minus.appendTo(this.$container);
      return this.$container;
  };
 
  RangesView.prototype.remove = function(){
    
    if(this.$container) {
      this.$container.remove();
    }
  };
  
  return RangesView;
});