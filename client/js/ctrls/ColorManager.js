define(['ctrl/COMMON'], function (COMMON) {
  var ColorManager = function (model, ctrl) {
     this._model = model; //colorDomain //colorTheme //colorIndex //colorDomainName //colorRange
     this._ctrl  = ctrl; //chart control
     this._themeColors = { //fixed color sets inside system
         'd3.category20': d3.scale.category20().range(),
         'd3.category10': d3.scale.category10().range(),
         'd3.category20c': d3.scale.category20c().range(),
         'd3.category20b': d3.scale.category20b().range(),
         'google 20c': [
             "#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", 
             "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"
           ],
       'slate4': [
         "#f17673","#f29006","#62c462","#6bc6e1"
       ]
     };
     this._MAX_ITEMS_NUM = 50;
     this._defaultTheme = 'd3.category10'; //user inputed value
     this._defalutColor = "#555";
     this._defaultColorSeparator = [0.99];
 };

 ColorManager.prototype.clearAll = function() {
     this._model.set({ 'colorIndexes': {},
                       'colorTheme': '',
                       'colorDomainName': '',
                       'colorDomain': []
                     }, {silent: true});
     this._ctrl.trigger("change:_save_model_");
 };

  //get the colorset list to show combox
  ColorManager.prototype.getThemes = function(){
      return Object.keys(this._themeColors);
  };

  ColorManager.prototype.getTheme = function(){
     var theme = this._model.get('colorTheme');
     if(_.isEmpty(theme) || !_.has(this._themeColors, theme)) {
         theme = this._defaultTheme;
     }
     return theme;
  };
  
  ColorManager.prototype.getSeparator = function(){
    var colorSeparator = this._model.get('colorSeparator');

    colorSeparator = COMMON.makeObject(colorSeparator, this._defaultColorSeparator);

    if(_.isEmpty(colorSeparator)) {
        colorSeparator = this._defaultColorSeparator;
    }

    return colorSeparator;
  };

  ColorManager.prototype.setSeparator = function(arr) {
    var bDirty=false,
        origSeparator = this.getSeparator();

    if(!COMMON.isEqualArray(origSeparator, arr) && !_.isEmpty(arr)) {
       this._model.set('colorSeparator', arr);
       bDirty = true;
    }
    return bDirty;
  };
  

  //set the use selected theme
  //if return not null, trigger event to chart to inofrm changing of the whole colormap
  ColorManager.prototype.setTheme = function(selectedTheme){
     var bDirty=false, theme = this.getTheme(),
         themeIndex = Object.keys(this._themeColors).indexOf(selectedTheme);
     if(theme != selectedTheme && themeIndex >= 0) {
         this._model.set('colorTheme', selectedTheme);
         this._model.set('colorIndexes', {}); //reset _colorIndexes
         bDirty = true;
     }
     return bDirty;
  };

  //get colorset to show the color list in user interface
  ColorManager.prototype.getThemeColors = function() {
      var colors= [], theme = this.getTheme();
      return this._themeColors[theme];
  };

 //the function is used for setting start or end color or number domain
 ColorManager.prototype.setColorIndex = function(indexOfStartOrEnd, color) {
     var theme = this.getTheme(),
         colorIndex = this._themeColors[theme].indexOf(color),
         colorIndexes = COMMON.makeObject(this._model.get('colorIndexes'), {});
     if(colorIndex >=0  && (indexOfStartOrEnd === 0 || indexOfStartOrEnd == 1 ) ){
         colorIndexes[indexOfStartOrEnd] = colorIndex;
         this._model.set('colorIndexes', colorIndexes);
     }
  };

  //set colorIndex when  user select or change the color mapping to an item 
  //--- trigger event to chart to inform the change of one color in colormap
  ColorManager.prototype.setColor = function(itemName, color) {
    var items = this.getDomain(),
        isNumberDomain = this.isNumberDomain(),
        itemIndex = (isNumberDomain)? itemName : items.indexOf(itemName),
        colorIndexes = COMMON.makeObject(this._model.get('colorIndexes'),{}),
        theme = this.getTheme(),
        colorIndex = this._themeColors[theme].indexOf(color);
    
    if(itemIndex <0 ) return false;

    if(itemIndex != colorIndex) {
        if(colorIndexes[itemIndex] != colorIndex) { //add index to colorIndexes
            colorIndexes[itemIndex] = colorIndex;
        } //else the colorIndex has been set up
    } else {  //the natural number order such as {1:1,2:2,4:4,5:5}
            delete colorIndexes[itemIndex];
    }
    this._model.set('colorIndexes',colorIndexes);
    return true;
  };


  //get color<>item objst to show the current color mapping status in user interface
  ColorManager.prototype.getColormap = function() {
      var colormap = {},
          colorIndexes = COMMON.makeObject(this._model.get('colorIndexes'),{}),
          colorIndex=-1,
          separator = this.getSeparator().slice(0), //copy
          items=this.getDomain();

     if(!items || items.length <=0 ) return colormap;

     var colors = this.getThemeColors();

     if(this.isNumberDomain()){
         items = separator;
         //add start and end
         items.unshift(0);//add 0 to beginning 
         items.push(1);//add 1 to end
         items.forEach(function(item, itemIndex) { //the items have been defined
            if(_.isEmpty(colorIndexes) ) { //defalut color setting :colorIndex = itemIndex, user have not defined color
                colormap[itemIndex] = colors[itemIndex % colors.length];
            } else if((colorIndex = colorIndexes[itemIndex]) >=0 ) { //user defined color<>item mapping
                colormap[itemIndex] = colors[colorIndex];
            }  else { //colorIndex < 0 : natural number order of the defined color
                colormap[itemIndex] = colors[itemIndex % colors.length];
            }
        });
     } else {
        //items =this.getDomain();
        items.forEach(function(item, itemIndex) { //the items have been defined
            if(_.isEmpty(colorIndexes) ) { //defalut color setting :colorIndex = itemIndex, user have not defined color
                colormap[item] = colors[itemIndex % colors.length];
            } else if((colorIndex = colorIndexes[itemIndex]) >=0 ) { //user defined color<>item mapping
                colormap[item] = colors[colorIndex];
            }  else { //colorIndex < 0 : natural number order of the defined color
                colormap[item] = colors[itemIndex % colors.length];
            }
        });
     }

     return colormap;
  };

  //get the color a given item
  //if domain has not been set, the default coloring will be used
  ColorManager.prototype.getColor = function(itemName){
     var color = this._defalutColor,
         items = this.getDomain(),
         itemIndex = items.indexOf(itemName),
         theme = this.getTheme(),
         colors = this.getThemeColors(),
         colorIndexes = COMMON.makeObject(this._model.get('colorIndexes'),{}),
         colorIndex = -1;

     if(itemIndex >= 0 ) { //known item
        if(_.isEmpty(colorIndexes) ) { //defalut color setting :colorIndex = itemIndex
            color = colors[itemIndex % colors.length];
        } else {  //user defined itemIndex<-->colorIndex mapping
            colorIndex = colorIndexes[itemIndex];
            if(colorIndex >= 0 ) {
                color = colors[colorIndex]; 
            } else { //natural number order of defined color:colorIndex = itemIndex
                color = colors[itemIndex % colors.length];
            }
        }
     } else { //unknown item -- maybe the datamapping panel is still not opened: no itemIndex, nocolorIndexes
         if(!this.defaultColoring) {
             this.defalutColoring = d3.scale.category20();
         }
         this.defalutColoring(itemName);
     }
     return color;
  };

  //parameters: @name, @items
  //no defalut domain for any chart
  //--- trigger event to chart to inform changing of the whole colormap
  ColorManager.prototype.setDomain = function(/*name,items*/) {
     var bDirty=false;

     if(arguments.length > 0 && arguments[0].constructor == String &&
       this._model.get('colorDomainName') != arguments[0]) {
            this._model.set('colorDomainName', arguments[0]);
            bDirty = true;
      }

     if(arguments.length > 1) {
         var domain = (arguments[1].constructor == Array)? arguments[1]: [arguments[1]];

         if( !COMMON.isEqualArray(this.getDomain(), domain) ) {
            if(domain.length > this._MAX_ITEMS_NUM) {
                this._model.set('colorDomain', domain.slice(0, this._MAX_ITEMS_NUM)); //clone and then save
            } else {
                this._model.set('colorDomain', domain.slice(0));
            }
            this._model.set('colorIndexes', {}); //reset _colorIndexes
            bDirty = true;
        }
     }
     return bDirty;
  };

  ColorManager.prototype.getDomainName = function() {
      return  this._model.get('colorDomainName');
  };

  ColorManager.prototype.getDomain = function() {
     return  COMMON.makeObject(this._model.get('colorDomain'), []);
  };

  /** the following function are using chart ctrl parameters  */
  //show the dataset List
  ColorManager.prototype.getDatasetList = function() {
    var self = this, dataset= [];
    var dataTypes = this._ctrl.dataManager().getDataType(),
        mapperProps = this._ctrl.dataManager().getMapperProps();
    if( dataTypes) {
       //get the string columns
       dataset= Object.keys(dataTypes);
    }
    //add xx.map2 whose type is 'number' or 'date'
    _.each(mapperProps, function(item, key){
        //dataset[item.label] = item.map2;
        if(item.type=='number') {
            dataset.push(item.label.trim());
        }
    });
    return dataset;
  };
  ColorManager.prototype.getRangeOfDataset = function(dataset) {
    var items=[], 
        mapperPropsObj = this._ctrl.dataManager().getMapperProps();
    
    //get the range of one mapper property
    for( var prop in mapperPropsObj) {
        if(mapperPropsObj[prop].label.trim() == dataset){
            items = mapperPropsObj[prop].map2;
            break;
        }
    }
    //get the range of one column 
    if(items.length === 0 ) {
        items = this._ctrl.dataManager().getDataRange(dataset);
    }
    return items;
  };
  
  ColorManager.prototype.isDataMappingDomain = function(domainName) {
     
     var column = (domainName) ? domainName: this.getDomainName(),
         mapperPropsObj = this._ctrl.dataManager().getMapperProps();
     if(!_.isEmpty(column)) {
        for(var prop in mapperPropsObj) {
            if(mapperPropsObj[prop].label == column) {
                return true;
            }
        }
     }
     return false;
  };
  
  ColorManager.prototype.isColumnDomain = function(domainName) {
     var column = (domainName) ? domainName: this.getDomainName(),
         dataManager = this._ctrl.dataManager(),
         mapper = dataManager.getMapper();
     if(!_.isEmpty(column)) {
        var labels = _.values(dataManager.getMapperProps()).map(function(prop){ return prop.label;});
        return mapper && labels.indexOf(column)<0;
     }
     return false;
  };
  
  ColorManager.prototype.isNumberDomain = function(domainName) {
     var column = (domainName) ? domainName: this.getDomainName();
        dataTypes = this._ctrl.dataManager().getDataType();
     if(!_.isEmpty(column)) {
        return dataTypes && (dataTypes[column] == 'number');
     }
     return false;
  };
  /*
  ColorManager.prototype.getRangeOfColumn = function(column) {
    return this._ctrl.dataManager().getDataRange(column);
  };
 */
 ColorManager.prototype.getColorOfColumn = function(columnName) {
    var  color = this._defalutColor,
         colormap = this.getColormap();
    
    if(this.isDataMappingDomain() && colormap[columnName]) {  //data mapping array
      color=  colormap[columnName]; //default color         
    }
    
    return color;
 };
 
 ColorManager.prototype.getColorOfRow = function(row) {
    var self  = this,
        color = this._defalutColor,
        domain = this.getDomain(),
        colorDomainName = this.getDomainName(),
        colormap = this.getColormap(),
        colorScale;

        if(this.isDataMappingDomain()) {  //data mapping array
            return color; //default color
        }
        if(this.isNumberDomain(colorDomainName) && row[colorDomainName]) {//column
            var range = (domain && domain.length >1)? (domain[1]-domain[0]) : 1,
                value = (+row[colorDomainName] -domain[0]) /range,
                separator = this.getSeparator().slice(0);
        
        //add start and end
        separator.unshift(0);
        separator.push(1);
            
            /*for(var i=1; i<domain.length; i++) {
              if(value >= domain[i-1] && value < domain[i]){
                 colorScale = d3.scale.linear()
                      .domain([domain[i-1], domain[i]])
                      .range([colormap[domain[i-1]], colormap[domain[i]]]);
                 color = colorScale(value);
                 break;
              }else if( value == domain[i]){
                 colorScale = d3.scale.linear()
                      .domain([domain[i-1], domain[i]])
                      .range([colormap[domain[i-1]], colormap[domain[i]]]);
                color = colorScale(value);
                break;
              }
            }*/
            colorScale =  d3.scale.linear()
                      .domain(separator)
                      .range(_.values(colormap));
            color = colorScale(value);
       } else if(row.hasOwnProperty(colorDomainName) ) { //string column
           color = colormap[row[colorDomainName]];
       }
       //console.log(color);
       return color;
  };
 
 ColorManager.prototype.chartUpdatingWithColors = function(options, shouldCheckData) {
    var self = this, dataManager= this._ctrl.dataManager();
    dataManager.updateFromColormapping({ COLOR_MANAGER: options}, shouldCheckData);
 };
 
 return ColorManager;
});
