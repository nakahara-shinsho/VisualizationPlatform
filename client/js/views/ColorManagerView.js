define(['text!templates/color_manager.html',
        'util/simplecolorpicker/jquery.simplecolorpicker',
        'css!util/simplecolorpicker/jquery.simplecolorpicker.css',
        'css!util/simplecolorpicker/jquery.simplecolorpicker-regularfont.css'], 
        function(dataMappingTpl) {
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
      this.listenTo(framework.mediator, 'data_mapping:update_number_dataset', this.updateDataMapping);
      //this.listenTo(framework.mediator, 'color_mapping:update_separator', this.updateNumberSeparator);//not used
    },
   
    events: { 
        "change .optionset .dataset" : "datalistSelected",
        "change .optionset .colorset": "themeSelected",
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
          
          // initialize colormap
          this.drawColormap();
        }
        return this.$el; //return from render function
    },
    
    //add colormap after select a theme or a dataset
    datalistSelected: function(ev) {
       var $select = $(ev.target).find("option:selected"),
           dataset = $select.val();
           
       //TBD: get data for dataset columns of nonexisted in BIG data cases 
       var items = this.colorManager.getItemsOfDataset(dataset);
      
       if(this.colorManager.setDomain(dataset, items)) {
            //update colormap with new dataset
            this.drawColormap(UPDATE_COLOR_MAP.DATASET);
       }
    },
    
    themeSelected: function(ev) {
       var $select = $(ev.target).find("option:selected"),
           theme = $select.val();
           
           this.colorManager.setTheme(theme);
           //update colormap with new theme
           this.drawColormap(UPDATE_COLOR_MAP.THEME);
    },
   
    
    //data mapping for numberic columns list
    updateDataMapping: function (eventObject) {
        if(eventObject && eventObject.domainName == this.colorManager.getDomainName()) {
           //update colormap with changed color domain
            this.drawColormap(UPDATE_COLOR_MAP.DATAITEM);
        }
    },
    
    /*updateNumberSeparator: function (separator) {
      
      if(this.colorManager.setSeparator(separator)) {
        //update colormap with changed color domain
         this.drawColormap(UPDATE_COLOR_MAP.SEPARATOR);
      }
    },*/
    
    _drawColorpad: function(color, key, $parent) {
     
        var self=this,
          colorManager = this.colorManager,
          isNumberDomain =colorManager.isNumberDomain(),
          domain =colorManager.getDomain(),
          themeColors = colorManager.getThemeColors(),
          domainName = colorManager.getDomainName();
       
        var $padContainer=$('<div/>', {class: 'color-pad'})
            .append('<i>'+ (/*(isNumberDomain)? domainName+': '+key :*/ key )  +'</i>'),
            $selection = $('<selection/>', {name: key}).appendTo($padContainer);
          
          themeColors.forEach(function(themeColor){
              $('<option/>',{value: themeColor})
                .text(themeColor)
                .appendTo($selection);
          });
          
          $selection.appendTo($padContainer).simplecolorpicker({picker: true, theme: 'regularfont'});
          $selection.simplecolorpicker('selectColor', color);
          $selection.on('change', function() { //update domainItem color
              //$(this) is $selection
              var domainItem =  $(this).attr('name');
              if(isNumberDomain) {
                  domainItem = +domainItem;
              }
              if(colorManager.setColor(domainItem, $(this).val())) { //update gradient bar when changeing color 
                  if(isNumberDomain) {
                    var colormap = colorManager.getColormap(),
                        keys = Object.keys(colormap),
                        $gradient = self._drawGradientBar(colormap[keys[0]], colormap[keys[1]]);
                        $parent.find('.color-ranges').replaceWith($gradient);
                  }
                 colorManager.colorUpdating();
              }
          });
          
          $parent.append($padContainer);
          
          return $padContainer;
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
   
   drawColormap: function(updateStatus) {
      var self=this,
          isNumberDomain = this.colorManager.isNumberDomain(), 
          colormap = this.colorManager.getColormap(),
          $colormap_content = this.$el.find('.colormap-content').empty();
  
      if(this.colorManager.isNumberDomain()) { //draw numder domain colormap
          var $container = $('<div/>').css({display: 'inline-block', width: '100%'}).appendTo($colormap_content),
              keys = Object.keys(colormap);
          self._drawColorpad(colormap[keys[0]], keys[0], $container).css({display: 'inline-block', margin: '0px', width: '10%'});
          this._drawGradientBar(colormap[keys[0]], colormap[keys[1]]).appendTo($container);
          self._drawColorpad(colormap[keys[1]], keys[1], $container).css({display: 'inline-block', margin: '0px', width: '10%'});
      } else {
        //draw color-pad
        _.each(colormap, function(color, key) {
           self._drawColorpad(color, key, $colormap_content);
        });
      }
                
      if(updateStatus && updateStatus != UPDATE_COLOR_MAP.EMPTY ) { //update the whole colormap
          //update chart
          this.colorManager.colorUpdating();//chartUpdating
      }
   }, //drawColormap end
    
    close: function() {
        $('.simplecolorpicker').remove();
        this.remove(); 
    }
  
  });
  
  
  
  return MyView;
});