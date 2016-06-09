define([ 'ctrl/COMMON',
          'util/nouislider/nouislider', 
          'css!util/nouislider/nouislider'], function(COMMON, noUiSlider) {
  
  var SliderView = function(){
    this.slider_dom = null;
  };
  
  SliderView.prototype.render = function($ctrl, ioctrl) {
      var self = this,
          range   = $ctrl.data('range'),
          savedval = $ctrl.data('value');
      
      var $container  = $("<div class='form-control input-sm' />"),
          $slider     = $('<div/>',{ type: 'selection' }).appendTo($container);
      
      var limit = Math.max(COMMON.numberAfterDot(range[0]), COMMON.numberAfterDot(range[1])),
          initval = [ +(range[0]), +(range[1])];//default value
      
      if(savedval) {
        if(savedval[0] && savedval[0] > initval[0] && savedval[0]<initval[1]) initval[0] = savedval[0];
        if(savedval[1] && savedval[1] < initval[1] && savedval[1]>initval[0]) initval[1] = savedval[1];
      }
      
      this.slider_dom  = $slider.get(0);
    
      noUiSlider.create(this.slider_dom, {
        connect: true,
        behaviour: 'drag-tap',
        range: {
          min: +(range[0]),
          max: +(range[1])
        },
        start: initval
      });
     
      var $min = $slider.find('.noUi-handle:first').text(initval[0]),
          $max = $slider.find('.noUi-handle:last').text(initval[1]);
      
      this.slider_dom.noUiSlider
      .on('change', function (values, handle) {
        var newval = [(+values[0]).toFixed(limit), (+values[1]).toFixed(limit)];
        
        if(initval[0]!= newval[0] || initval[1]!= newval[1]){
            $min.text(newval[0]);
            $max.text(newval[1]);
            ioctrl.setValue($ctrl.attr('id'), newval);
        }
      });
      this.slider_dom.noUiSlider
      .on('update', function (values, handle) {
        var newval = [(+values[0]).toFixed(limit), (+values[1]).toFixed(limit)];
        
        if(initval[0]!= newval[0] || initval[1]!= newval[1]){
            $min.text(newval[0]);
            $max.text(newval[1]);
        }
      });
      
      return  $container;
  }; 
  
  SliderView.prototype.remove = function(){
    if(this.slider_dom) {
      this.slider_dom.noUiSlider.destroy();
    }
  };
  
  return SliderView;
});