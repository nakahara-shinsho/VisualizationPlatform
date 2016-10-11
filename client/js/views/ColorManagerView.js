define(['util/unic/Wrapper',
        'text!templates/color_manager.html',
        'util/simplecolorpicker/jquery.simplecolorpicker',
        'css!util/simplecolorpicker/jquery.simplecolorpicker.css',
        'css!util/simplecolorpicker/jquery.simplecolorpicker-regularfont.css'], 
        function(Wrapper,dataMappingTpl) {
  var UPDATE_COLOR_MAP = {
        EMPTY: 0,
        THEME: 1,
        DATASET: 2,
        DATAITEM: 3,
        SEPARATOR : 4
   };
  var MyView = Backbone.View.extend({
    template: _.template(dataMappingTpl),
    
    initialize: function () {
      
      _.bindAll(this, 'render');
      this.$el.html( this.template());
      this.listenTo(framework.mediator, 'data_mapping:update_number_dataset', this.updateWithNewDataMapping);// only one colorview , so mediator
      this.listenTo(framework.mediator, 'color_mapping:update_separator', this.updateNumberSeparator);//not used
    },
   
    events: { 
        "change .optionset .dataset" : "datalistSelected",
        "change .optionset .colorset": "themeSelected",
        "dblclick .colormap": "_drawColorSlider"
    },
    
    render: function(colorManager) {
      
      this.colorManager = colorManager;
      
      var $colorset = this.$el.find('.colorset'),
          $dataset = this.$el.find('.dataset'),
          $colormap_content = this.$el.find('.colormap-content');
      
      if(colorManager) { //color manager have been initialized
          
          //add dataset list
          var domainName = colorManager.getDomainName();
          colorManager.getDatasetList().forEach( function(dataGroupName) {
             var $option= $('<option>', {value: dataGroupName}).text(dataGroupName).appendTo($dataset);
             if(dataGroupName == domainName) {
                 $option.prop('selected', true);
             }
          });//update dataset list with datamapping events 
          
          //add theme list
          var currTheme = colorManager.getTheme();
          colorManager.getThemes().forEach( function(themeName) {
             var $option= $('<option>', {value: themeName}).text(themeName).appendTo($colorset);
             if(themeName == currTheme) {
                 $option.prop('selected', true);
             }
          });
          
          // initialize colormap (donot update chart)
          this.drawColormap();
        }
        return this.$el; //return from render function
    },
    
    //add colormap after select a theme or a dataset
    datalistSelected: function(ev) {
       var $select = $(ev.target).find("option:selected"),
           dataset = $select.val();
           
       //TBD: get data for dataset columns of nonexisted in BIG data cases 
       var items = this.colorManager.getRangeOfDataset(dataset);
       
       if(this.colorManager.setDomain(dataset, items)) {
            //update colormap and chart with new dataset
            this.drawColormap(UPDATE_COLOR_MAP.DATASET);
       }

    },
    
    themeSelected: function(ev) {
       var $select = $(ev.target).find("option:selected"),
           theme = $select.val();
           
           this.colorManager.setTheme(theme);
           //update colormap and chart with new theme
           this.drawColormap(UPDATE_COLOR_MAP.THEME);
    },
   
    
    //data mapping for numberic columns list
    updateWithNewDataMapping: function (eventObject) {
        if(eventObject && eventObject.domainName == this.colorManager.getDomainName()) {
           //update colormap and chart with changed color domain
            this.drawColormap(UPDATE_COLOR_MAP.DATAITEM);
        }
    },
    
    _drawColorpad: function(color, key, $parent) {
     
        var self=this,
          colorManager = this.colorManager,
          isNumberDomain =colorManager.isNumberDomain(),
          domain =colorManager.getDomain(),
          themeColors = colorManager.getThemeColors(),
          domainName = colorManager.getDomainName();
       
        var $padContainer=$('<div/>', {class: 'color-pad'})
            .append('<i>'+  (isNumberDomain)?'': key   +'</i>'),
            $selection = $('<selection/>', {name: key}).appendTo($padContainer);
          
          themeColors.forEach(function(themeColor){
              $('<option/>',{value: themeColor})
                .text(themeColor)
                .appendTo($selection);
          });
          
          $selection.appendTo($padContainer).simplecolorpicker({picker: true, theme: 'regularfont'});
          $selection.simplecolorpicker('selectColor', color);
          $selection.on('change', function() { //update domainItem color with user operation
              var domainItem =  $(this).attr('name'); //$(this) is $selection
              if(isNumberDomain) {
                  domainItem = +domainItem;
              }
              if(colorManager.setColor(domainItem, $(this).val())) { //update gradient bar when changeing color
                  if(isNumberDomain) {
                    //var colormap = colorManager.getColormap(),
                    //    keys = Object.keys(colormap),
                    //    $gradient = self._drawGradientBar(colormap[keys[0]], colormap[keys[1]]);
                    //    $parent.find('.color-ranges').replaceWith($gradient);
                  }
                 colorManager.chartUpdatingWithColors(null, false);
              }
          });
          
          $parent.append($padContainer);
          
          return $padContainer;
    },
    
    _drawColorSlider: function(evt) {
        var self=this,
          colorManager = this.colorManager,
          isNumberDomain =colorManager.isNumberDomain();
        
        if(isNumberDomain) {
          Wrapper.show($("<div/>", {id: 'multi-ranges-silder'}).data('type', 'multi-ranges-silder'), 
            this.$el.find(".colormap"), 
            self.colorManager);
        }
    },

    _drawGradientBar: function(color1, color2) {
     
      return $('<div>',{ class: 'color-ranges'})
            .css({
                height: '15px',
                background: 'linear-gradient(to right, '+ color1 + ','+ color2+')',
                display: 'inline-block', 
                width: '75%'
          });
   },
   
    updateNumberSeparator: function (separator) {
      if(this.colorManager.setSeparator(separator)) {
        //update colormap with changed color domain
         this.colorManager.chartUpdatingWithColors(null, true);//true-- check whether or not data is completely
      }
    },
    
   drawColormap: function(updateStatus) {
      var self=this,
          isNumberDomain = this.colorManager.isNumberDomain(), 
          colormap = this.colorManager.getColormap(),
          $colormap_content = this.$el.find('.colormap-content').empty();
  
      if(this.colorManager.isNumberDomain()) { //draw numder domain color-map
         
         /* var $container = $('<div/>').css({display: 'inline-block', width: '100%'}).appendTo($colormap_content),
              keys = Object.keys(colormap);
          if(keys.length >1 ) {
            self._drawColorpad(colormap[keys[0]], keys[0], $container).css({display: 'inline-block', margin: '0px', width: '10%'});//start
            this._drawGradientBar(colormap[keys[0]], colormap[keys[1]]).appendTo($container);//bar
            self._drawColorpad(colormap[keys[1]], keys[1], $container).css({display: 'inline-block', margin: '0px', width: '10%'});//end
          }
          */
         _.each(colormap, function(color, key) {
           self._drawColorpad(color, key, $colormap_content);
        });

        //Wrapper.show($("<div/>").data('type', 'multi-ranges-silder'), $colormap_content, self.colorManager);

/*
        var $container = $('<div/>').css({display: 'inline-block', width: '100%'}).appendTo($colormap_content);
        _.each(colormap, function(color, key) {
            self._drawColorpad(color, key, $container).css({display: 'inline-block', margin: '0px', width: '10%'});
        });

       // var multiRangesSlider =  new SliderLib();
        require(['util/unic/multiRangesSlider/main'], function(CtrlLib){
          var multiRangesSlider =  new CtrlLib();
          _.each(colormap, function(color, key) {
            var $ctrl_content= multiRangesSlider.render(null, self.colorManager);
            $('<div class="content">').append($ctrl_content).appendTo($colormap_content);
          });
        });      
        
*/
      } else { //draw string domain color-pad
        _.each(colormap, function(color, key) {
           self._drawColorpad(color, key, $colormap_content);
        });
      }

      //update chart
      if(updateStatus && updateStatus != UPDATE_COLOR_MAP.EMPTY ) { //update the whole colormap
          //update chart
          this.colorManager.chartUpdatingWithColors(null, true);//true-- check whether or not data is completely
      }
   }, //drawColormap end
    
    close: function() {
        $('.simplecolorpicker').remove();
        this.remove(); 
    }
  
  });
  
  
  
  return MyView;
});