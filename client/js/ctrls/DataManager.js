define(['ctrl/COMMON'], function (COMMON) {
 
 //the data flag comes from server
 var BIG = {
        NONE: 0,
        ROW: 1,
        COLUMN: 2,
        BOTH: 3  
    };
 
 //the flag computed in client
 var DEEPLINK = {
      NONE: 0,
      LOCAL: 1,
      WORKER: 2,
      GLOBAL: 3
 };
 
 var DataManager = function(boardModel, chartCtrl){
      this._model = boardModel;
      this._ctrl  = chartCtrl;
      this._data = {_default_table_key_: '_table_', _$mapper_props_:{}, _infer_: {} };
      this._dataset_url_root = 'api/data/';//the root of virtual table
 };
 
 DataManager.prototype._writeRowRefiner =  function(changedAttrs, options) { 
     var myRowRefiner = $.extend(true, {}, this._readRowRefiner(), changedAttrs);
     myRowRefiner = _.pick(myRowRefiner, function(range, column) { //delete null range before save 
        return !!range;
     });
     this._model.set({'dataRefiner': myRowRefiner}, options);
     if(options && !options.silent) {
       this.updateChart('REFINER', changedAttrs);
       this._ctrl.trigger("change:_data_link_", changedAttrs, this._model.get('vtname'),
         this._getInferData('_default_table_key_'));
     }
 };
 
 DataManager.prototype._readRowRefiner= function() {
    return COMMON.makeObject(this._model.get('dataRefiner'), {});//convert to object
 };
 
 DataManager.prototype._writeExtraRowRefiner =  function(changedExtraRefinerObj) { 
     var myExtraRowRefinerObj = $.extend(true, {}, this._readExtraRowRefiner(), changedExtraRefinerObj);
     this._model.set({'dataExtraRefiner': myExtraRowRefinerObj}, {silent: true});
 };
 
 DataManager.prototype._readExtraRowRefiner= function() {
    return COMMON.makeObject(this._model.get('dataExtraRefiner'), {});//convert to object
 };
 
 DataManager.prototype._writeExtraColumnRefiner =  function(changedExtraRefinerObj) { 
     var myExtraColumnRefinerObj = $.extend(true, {}, this._readExtraRowRefiner(), changedExtraRefinerObj);
     this._model.set({'dataExtraSelector': myExtraColumnRefinerObj }, {silent: true});
 };
 
 DataManager.prototype._readExtraColumnRefiner= function() {
    return COMMON.makeObject(this._model.get('dataExtraSelector'), {});//convert to object
 };
 
 DataManager.prototype._writeColumnRefiner =  function(selector, options) {
    if(selector.constructor == Array ) {
      var dataTypes = this.getDataType(),
          numberColumns = _.keys(dataTypes).filter(function(column){
              return dataTypes[column] == 'number';
          });
      if(COMMON.isEqualArray(selector, numberColumns) ) {
        this._model.set({'dataSelector': ''}, options);
      } else {
        this._model.set({'dataSelector': selector.slice(0)}, options);
      }
      if(options && !options.silent) {
         this.updateChart('SELECTOR', selector);
         this._ctrl.trigger("change:_data_link_", selector, this._model.get('vtname'), 
           this._getInferData('_default_table_key_'));
      }
    }
 };
 
 DataManager.prototype._readColumnRefiner = function() {
    var retColumns = this._model.get('dataSelector');
    if(retColumns === undefined || retColumns ==='') { //return all columns
      retColumns = _.keys(this.getDataType());
    } else {
      retColumns= COMMON.makeObject(retColumns, []);
    }
    return retColumns;
 };
 
 DataManager.prototype._writeMapper =  function(mappings, options) {
    var mappedColumns = this._readMapper(); //convert to object
    
    this._model.set('dataMapper', $.extend(/*true,*/ {}, mappedColumns, mappings), options); //rewrite only address so that the old setting can be deleted 
    if(options && !options.silent) {
         this.updateChart('MAPPER', mappings);
    }
 };
 
 DataManager.prototype._readMapper = function() {
    return  COMMON.makeObject(this._model.get('dataMapper'), {});//convert to array
 };
 
 DataManager.prototype.getDataType = function(key) {
    var type = this._getInferData('_dataTypes_', {});
    if(key && type[key]) {
        type = type[key];
    }
    return type; 
 };
 
 DataManager.prototype.setDataType = function(typesObj) {
    if(typesObj) { 
      var types = this.getDataType();
      this._setInferData('_dataTypes_',$.extend(true,{}, types, typesObj)); 
    }
 };
 
 DataManager.prototype.getDataRange = function(key) {
    var range = this._getInferData('_dataRanges_', {});
    if(key) {
        range = range[key];
    } 
    return range;
 };
 
 DataManager.prototype.setDataRange = function(rangesObj) {
    if(rangesObj) {
        var ranges = this.getDataRange();
        this._setInferData('_dataRanges_', $.extend(true,{}, ranges, rangesObj)); 
    }
 };
 
 DataManager.prototype.setMapperProps = function() {
      var self = this;
      if(arguments.length ==1  && arguments[0].constructor== Object) {
        this.setData('_$mapper_props_', arguments[0]); //reference
        _.each(arguments[0], function(item, key){
          if(item.map2 !== undefined && _.isEmpty(self.getMapper(key))) {
            self.setMapper(key, item.map2);
          }
        });
      }
      else if(arguments.length >=2 && arguments[0].constructor== String) {
        var obj ={};
        obj[arguments[0]] = arguments[1];
        this.setData('_$mapper_props_', obj); //reference
        
        var item  = arguments[1];
        if(item.map2 !== undefined && _.isEmpty(self.getMapper(arguments[0]))) {
          self.setMapper(arguments[0], item.map2);
        }
      }
 };
  
 DataManager.prototype.getMapperProps = function(prop) {
      var self = this, value,
          dataMapper = $.extend(true, {}, this.getData('_$mapper_props_'));//deep clone
      if(prop) {
        value = self.getMapper(prop);
         if(value !== undefined) { //!important: null value is acceptable
             dataMapper[prop].map2 = value;
         }
         return dataMapper[prop];
      } else {
        _.each(dataMapper, function(item, key){
            value = self.getMapper(key);
            if(value !== undefined) { //!important: null value is acceptable
                item.map2 = value;
            }
        });
        return dataMapper;
      }
 };

 DataManager.prototype.setRowRefiner = function() {

      var dataTypes = this.getDataType(),
          hasRendered = this._ctrl.hasRendered();
      
      if(arguments.length <=0) return;
      
      if(arguments[0].constructor == Object) {
         toBeAdded = _.pick(arguments[0],  _.keys(dataTypes));
         //only set existed attributes
         if(!_.isEmpty(toBeAdded)) {
           this._writeRowRefiner(toBeAdded, { silent: !hasRendered } ); //the general 'change' event is triggered
         }
      } else if( _.has(dataTypes, arguments[0]) && arguments.length >1) { //(column, range)
           obj = {}; 
           obj[arguments[0]]=arguments[1];
           this._writeRowRefiner(obj, { silent: !hasRendered });// general 'change' event isn't triggered   
      }
  };
 
 DataManager.prototype.getRowRefiner = function(column) {
      var ret = null, refiner = this._readRowRefiner();
      if(column && _.has(refiner, column)){
        ret = refiner[column]; 
      } else {
        ret = refiner;
      }
      return ret;
 };
 
  //set design attributes or control attributes
 DataManager.prototype.setColumnRefiner = function() {
     var selector = [],
         dataTypes = this.getDataType(),
         hasRendered = this._ctrl.hasRendered();
     
     if(arguments.length <=0) return;
     
     if(arguments[0].constructor == Array) {
        selector = _.intersection(arguments[0], _.keys(dataTypes)); 
        if(!_.isEmpty(selector)) {
          this._writeColumnRefiner(selector, {silent: !hasRendered} );
        }
     }
     else if(arguments[0].constructor== String) {
        if(_.has(dataTypes, arguments[0])) {
            selector.push(arguments[0]);
            this._writeColumnRefiner(selector, {silent: !hasRendered});
        }
     }
  };
  
 DataManager.prototype.getColumnRefiner = function() {
      return this._readColumnRefiner();
  };  
 
 DataManager.prototype.setValue = function (){
     if(arguments.length <=0) return;
     
     if(arguments[0].constructor !== Array) {
         this.setRowRefiner.apply(this, arguments);
     } else {
         this.setColumnRefiner.apply(this, arguments);
     }
  };
 
 DataManager.prototype.getValue = function (key){
     if(key) {
         this.getRowRefiner(key);
     } else {
         this.getColumnRefiner();
     }
 };
 
 DataManager.prototype.getMapper = function(key) {
    var ret =null, mapper = this._readMapper();//convert to array
    if(key) {
        ret = mapper[key];
    } else {
        ret = mapper;
    }
    return ret;
 };
 
 DataManager.prototype.setMapper = function() {

   var mapperProps = this.getMapperProps(),
       hasRendered = this._ctrl.hasRendered(),
       hasInited = this._ctrl.hasInited();
   
   if(arguments.length <=0) return;
   
   if(arguments[0].constructor == Object) {
      toBeAdded = _.pick(arguments[0],  _.keys(mapperProps));
      if(!_.isEmpty(toBeAdded)) {
        this._writeMapper(toBeAdded, { silent: !hasRendered } ); //the general 'change' event is triggered
      }
   } else if( _.has( mapperProps, arguments[0]) && arguments.length >1) { //(column, range)
        obj = {};
        obj[arguments[0]]=arguments[1];
        this._writeMapper(obj, { silent: !hasRendered });// general 'change' event isn't triggered   
   }
 };
 
 DataManager.prototype.getPrimaryKeyColumns = function(size) {
   var pksObj = {}, 
       sizeObj = (size)? size: this._ctrl.size(); 
       mapperProps = this.getMapperProps();
   for(var key in mapperProps) {
     var nameOfSize = mapperProps[key].spk;
     if( nameOfSize && sizeObj[nameOfSize] && typeof(mapperProps[key].map2) ==='string') {
       var column = this.getMapper(key);
       if(!_.isEmpty(column) ) {
         pksObj[column] = sizeObj[nameOfSize];
       }
     }
   }
   return pksObj;
 };

//get data-mapped or color-mapped columns if not-existed in client
DataManager.prototype.getRenderingColumns = function() {
   var columns = [], colorManager= this._ctrl.colorManager();
   Array.prototype.push.apply(columns,this.getMappedColumns());
   if(colorManager.isColumnDomain()){
     columns.push(colorManager.getDomainName());
   }
   return columns;
};

//when option in data-mapping or color-mapping 
DataManager.prototype.isCachedColumn = function(column) {
  var row0 = this.getData()[0];
  return row0.hasOwnProperty(column);
};
 
DataManager.prototype.clearAll = function(key, value) { 
     this.clearData();
     this._model.set({'dataRefiner': {},
                      'dataSelector': [],
                      'dataExtraRefiner': {},
                      'dataExtraSelector': {},
                      'dataMapper': {}
                      },
                      { slient:true }); //dataMapper
     this._ctrl.trigger("change:_save_model_");
 };
 
 DataManager.prototype._setInferData = function(key, value) {
     var infer = this._data._infer_;
     if(!infer) { 
         this._data._infer_ = infer = {};
     }
     infer[key] = value;
 };
 
 DataManager.prototype._getInferData = function(key, initValue) {
     var infer = this._data._infer_;
     if(!key) {
        return infer;
     }
     if(!infer[key]) {
       return initValue;
     }
     return infer[key];
 };
 
 DataManager.prototype.clearData = function(key) {
      if(key && this._data[key]) {
          delete this._data[key];
      } else {
        this._data._default_table_key_='_table_';
        this._data._infer_= {};
        //this._$mapper_props_ will be kept
      }
 };
 
 DataManager.prototype.setData = function(key, value) {
     this._data[key] = value;
 };
 
 DataManager.prototype.getData = function(key, initValue) {
     var skey = key;
     if(!skey) {
         skey = this._getInferData('_default_table_key_'); //default key
     }
     if(!skey || !this._data[skey]) {
       return initValue;  
     }
     return this._data[skey];
 };
 
 DataManager.prototype.isHighlightRow = function(row) {
    var bHighlight = true, //coloring is  the default status
        dataTypes = this.getDataType();
    if(this._ctrl.isHighlightMode()) {
      var range, value, filterset = this.getRowRefiner(); //the filter conditions
      for(var column in filterset) {
         range = filterset[column];
         if(dataTypes[column]=='number') {
            value = +row[column];
            if(value< range[0] || value > range[1]){
                bHighlight = false;
                break;
            }
         } else {
             value = row[column];
             if(range.indexOf(value) <0 ) {
                bHighlight = false;
                break;
             }
         }
      }
    }
    return bHighlight;
 };
 
 DataManager.prototype.getFilteredColumns = function () {
   
   var refinedColumns = this.getColumnRefiner(),
       mappedColumns = this.getMappedColumns();
   
   return (this._ctrl.isHighlightMode())? mappedColumns : _.intersection(refinedColumns, mappedColumns);
 };
 
 DataManager.prototype.getFilteredRows = function () {
    var self = this,
        table = this.getData(),
        filtedRows = table; //initialized value
    
    if(!this._ctrl.isHighlightMode()) {
        var refiningObject = this.getRowRefiner(),
             dataTypes = this.getDataType();
        filtedRows = filtedRows.slice(0);
        Object.keys(refiningObject).forEach(function(column) { 
            var range = refiningObject[column], value;
            if(dataTypes[column] ==='number') {
              filtedRows = filtedRows.filter(function(d) {
                value = +d[column];
                return  value >= range[0] && value <= range[1];
              });
            } else {
              filtedRows = filtedRows.filter(function(d) {
                value = d[column];
                return  range.indexOf(value) >=0 ;
              });
            }
        });
    }
    
    return filtedRows;
 };
 
 DataManager.prototype.getFilteredDataRange = function (column, filtedRows) {
    return d3.extent(filtedRows, function(d, i){
        return +d[column];
    });
 };
 
 
 DataManager.prototype.getMappedColumns = function(key) {
     var columns = [], mapper = this._readMapper();
     for(var prop in mapper) {
       if(!_.isEmpty(mapper[prop])) {
         if(mapper[prop].constructor == String) {
           columns = _.union(columns, [mapper[prop]] );
         } else {
           columns = _.union(columns, mapper[prop] );
         }
       }
     }
     return columns;
 };
  
 DataManager.prototype._autoCheckDataTypes = function(table, myDataTypes) {
    var self=this,
        types = (myDataTypes)? myDataTypes:{};
    
    if(_.isEmpty(types) && table.length > 0) {
            var BreakException={};
            Object.keys(table[0]).forEach(function(key) {
                types[key] = 'number';
                try{
                table.forEach(function(row) {
                    if(! $.isNumeric(row[key])) {
                    throw BreakException;
                    }
                    
                });
                } catch(e) {
                if(e == BreakException) types[key] = 'string';
                else throw e;
                }
            });
    }
    this.setDataType(types);
    return types;
  };
 
 DataManager.prototype._autoCheckDataRanges = function(table, dataTypes, myDataRanges){
   var self = this, max, min,
       ranges = (myDataRanges)? myDataRanges:{};
   if(_.isEmpty(ranges) && table.length > 0) {
       _.keys(dataTypes).forEach(function(column){
           if(dataTypes[column] === 'number') {
               ranges[column] = d3.extent(table, function(row) { return +row[column]; });
           } else {
               var nest= d3.nest().key(function(row){ return row[column]; }).entries(table);
               ranges[column] = nest.map(function(d){return d.key;});
           }
       });
   }
   this.setDataRange(ranges);
 }; 
 
 //initialize data mapping and refiner/selector
 DataManager.prototype._autoSetDataMapper = function(dataTypes) {
    var self=this,
        BreakException={},
        mapperProps = this.getMapperProps();
    
    //initialize mapper
    if(mapperProps && _.isEmpty(this.getMapper()) ) {
        Object.keys(mapperProps).forEach(function(prop) {
            try{
                Object.keys(dataTypes).forEach(function(column) {
                if( _.isEmpty(mapperProps[prop].map2) && dataTypes[column] == mapperProps[prop].type ) {
                    if($.isArray(mapperProps[prop].map2)) {
                        self.setMapper(prop, [column]); //set init value
                        throw BreakException;
                    } else {
                        self.setMapper(prop, column);
                        throw BreakException;
                    }
                } //if end
                });//forEach end
            } catch(e) {
                if(e == BreakException){ /*isUpdate = true;*/ }
                else throw e;
            }
        }); //forEach end
    }
  };
  
  //initialize data mapping and refiner/selector
  DataManager.prototype._autoProcessing = function(table, myDataTypes, myDataRanges) {
    
    //set types
    var dataTypes = this._autoCheckDataTypes(table, myDataTypes);
    
    //set mapper
    this._autoSetDataMapper(dataTypes);
    
    //set ranges
    this._autoCheckDataRanges(table, dataTypes, myDataRanges);
    
    if(_.isEmpty(this.getColumnRefiner()) ) {
        //set selector(columnRefiner)
        var numberColumns = _.keys(dataTypes).filter(function(column, index){
            return dataTypes[column] === 'number';
        });
        this.setColumnRefiner(numberColumns);
    }
    
  };
 
 /**
   * This function will validate input data for drawing chart.
   * If data is validate, chart will be drawn.
   * @returns {Boolean}
   */
  DataManager.prototype.validate = function () {
    var mapperProps = this.getMapperProps();
    if(mapperProps && typeof(mapperProps) == 'object') {// return true if the _chart_ is not set.
      var BreakException={};
      try{
        Object.keys(mapperProps).forEach(function(prop) {
          if(mapperProps[prop].map2 === undefined ) {
            throw BreakException;
          }
        });
      }catch (e) {
        if(e == BreakException ) return false;
      }
    }
    return true;
  };
  
  //not used?
  DataManager.prototype.getQueryObject = function () {
    var query = {},
        where = this.getRowRefiner(),
        select = this.getColumnRefiner();
    
    if(!_.isEmpty(where)) {
      query._where_ = where;
    }
    
    if(!_.isEmpty(select)) {
      query._select_ = select;
    }
    
    query._highlight_ = this._ctrl.isHighlightMode();
    return query;
  };
  
 //get virtual table data from server, 'options' is parameters for filtering data
  DataManager.prototype.getDataFromServer = function(virtualTable, screenContext, sizeObj){
      var self = this,
          deferred = $.Deferred(),
          conditions = { } ,
          query_options = { type: 'POST', 
                            cache: false,
                            timeout: 30000, //3 seconds 
                            url: this._dataset_url_root + virtualTable,
                            data: conditions };
      
      conditions._context_ = $.extend(true, {}, window.framework.context, screenContext);
      conditions._select_= this.getRenderingColumns(); //this.getColumnRefiner();
      conditions._extra_select_= this._readExtraColumnRefiner();

      //TBD&I: if chart is highlight mode, the all condtions besides deepColumns' shouldn't be sent to server
      if(!this._ctrl.isHighlightMode()) {
          conditions._where_ = this.getRowRefiner();
          conditions._extra_where_ = this._readExtraRowRefiner();
      }
      
      var spk = this.getPrimaryKeyColumns(sizeObj);
      if(!_.isEmpty(spk)) {
        conditions._spk_ = spk;
      }
      
      $.ajax(query_options)
            .done( function (data) {
              var jsondata = JSON.parse(data);
              $.each(jsondata, function(key, value) { //data: {key:value,...}-- key='_data_', value is  {format:.., filled:}
                
                if(key =='_error_' || value.format=='_error_') {
                  console.error(value.filled);
                } else if(value.format=='csv'){
                  self.setData(key, d3.csv.parse(value.filled));
                } else if(value.format=='tsv'){
                  self.setData(key,d3.tsv.parse(value.filled));
                } else if(value.format=='json') {
                  if(typeof(value.filled) == "string"){
                    self.setData(key,JSON.parse(value.filled));
                  }else{
                    self.setData(key, value.filled);
                  }
                } else if(value.format=="text"){
                  self.setData(key, value.filled);
                } else {
                  self.setData(key, value);
                }
                
                if(value.mappable || key==='_table_') {
                  //in the current implementation, the widget constructor have been executed here!
                  self._setInferData('_default_table_key_', key);
                  self._autoProcessing(self.getData(), value.types, value.ranges);
                }
                
                if(value.family) {
                   self._setInferData('_family_', value.family);
                }
                
                if(value.big) {
                   self._setInferData('_big_', value.big);
                }
              });
        
              return deferred.resolve();
            })
            .fail(function(jqXHR, textStatus) {
                if(textStatus === 'timeout') {  //big data? it may be necessary for samping data
                    alert('Failed from timeout'); 
                }
            });
    
      return deferred.promise();
    }; 
   
  //deep update data if necessary
  DataManager.prototype.switchMode = function() {
    var self=this, chartInst = this._ctrl.chartInstance();
    if(this._isDeepUpdate()) {
     //TBD: will the existed data need to be cleared? -- same Virtual Table
       this.getDataFromServer(this._model.get('vtname')).done(
         function() {
           if(chartInst.update) {
             chartInst.update({MODE: self._ctrl.mode()});
           }
       });
    } else {
        if(chartInst.update) {
           chartInst.update({ MODE: self._ctrl.mode()});
        }
    }
  };
  
  /* link&update related functions  SRART */
  //update chart with changing refining parameters
  DataManager.prototype.updateChart = function(subkey, options) {
    var chartInst = this._ctrl.chartInstance(), vobj = {};
    vobj[subkey] = options;
    
    if(this._isDeepUpdate(subkey, (options.constructor==Array)? options:_.keys(options)) ) {
       //TBD: will the existed data need to be cleared? -- same Virtual Table
       this.getDataFromServer(this._model.get('vtname')).done(
         function() {
           if(chartInst.update) {
             chartInst.update({DATA_MANAGER: {SELECTOR: vobj}});
           }
       });
    } else {
        if(chartInst.update) {
            chartInst.update({DATA_MANAGER: vobj} );
        }
    }
  };
 
  DataManager.prototype.linkages = function(eventMessage, linked_vtName, lined_wkName ) {
      var self = this, statusOfLink;
      if(eventMessage.constructor == Object ) { //Row Refiner
        statusOfLink =this._checkDeepLink(eventMessage, linked_vtName, lined_wkName);
        if(statusOfLink) {
            this._deepLink4RowRefiner(eventMessage,/*lined_wkName,*/ linked_vtName, statusOfLink);
        } else {
            this._simpleLink4RowRefiner(eventMessage);
        }
      }
      else
      if(eventMessage.constructor == Array  ){ //Column refiner
         statusOfLink = this._checkDeepLink(eventMessage, linked_vtName, lined_wkName);
         if(statusOfLink) {
            this._deepLink4ColumnRefiner(eventMessage, /*linked_wkName,*/ linked_vtName, statusOfLink);
        } else {
            this._simpleLink4ColumnRefiner(eventMessage);
        }
      }
  };
  
  //update linked charts
  DataManager.prototype._simpleLink4RowRefiner =  function(linkedRefiner) { //have not set attributes into this.chart ?
      var self = this;
      
      if(!this.bSimpleLinking) {
        this.bSimpleLinking = true;
        var addRowRefiner = _.pick(linkedRefiner, _.keys(this.getDataType()));
        
        if(!_.isEmpty(addRowRefiner) ) {
            if(!_.isEmpty(addRowRefiner)) {
                this.setRowRefiner(addRowRefiner); //considtions of null range will be deleted
                if(this._ctrl.chartInstance().update) {
                    this._ctrl.chartInstance().update({DATA_MANAGER: {REFINER: null}}); 
                }
            }
        }  
        this.bSimpleLinking = false;
      }
  };
  
  //update linked charts with server query
  DataManager.prototype._deepLink4RowRefiner= function(linkedRefiner, linked_vtName, statusOfLink) {
        var self = this, 
            chartInst = this._ctrl.chartInstance(),
            allColumns =  _.keys(this.getDataType() ),
            obj={};

        if(!this.bDeepLinking) {
          this.bDeepLinking=true;
          
          if(statusOfLink == DEEPLINK.LOCAL) {
            this._writeRowRefiner(linkedRefiner, {silent: true});
          } else if(statusOfLink == DEEPLINK.WORKER){
            obj[linked_vtName] = linkedRefiner;
            this._writeExtraRowRefiner(obj);
            //add extra refiner
          } else if(statusOfLink == DEEPLINK.GLOBAL){
            obj[linked_wkName+'.'+linked_vtName] = linkedRefiner;
            this._writeExtraRowRefiner(obj);
            //add extra refiner
          }
                   
          this.getDataFromServer(this._model.get('vtname')).done(
              function() {
                if(chartInst.update) {
                    chartInst.update({DATA_MANAGER: {REFINER: null}});
                }
                self.bDeepLinking=false;
              }
            );
          }
  };
 
  DataManager.prototype._simpleLink4ColumnRefiner =  function(selector) {
      var self = this,
          chartInst = this._ctrl.chartInstance();
      
      if(!this.bSimpleLinking) {
        this.bSimpleLinking = true;
        var linkedSelector = _.intersection(selector, _.keys(this.getMappedColumns()) );
        this._writeColumnRefiner(selector, {silent: true});
        if(chartInst.update) {
            chartInst.update({DATA_MANAGER: {SELECTOR: linkedSelector}});
        }
      }
      this.bSimpleLinking = false;
    };
  
  //update linked charts with server query
  DataManager.prototype._deepLink4ColumnRefiner = function(selector, linked_vtName, statusOfLink ) {
     var self = this, obj = {},
        chartInst = this._ctrl.chartInstance();
        
     if(!this.bDeepLinking) {
       this.bDeepLinking=true;
       
       if(statusOfLink == DEEPLINK.LOCAL) {
         var linkedSelector = _.intersection(selector, _.keys(this.getMappedColumns()) );
         this._writeColumnRefiner(selector, {silent: true});
       } else if(statusOfLink == DEEPLINK.WORKER){
         obj[linked_vtName] = selector;
         this._writeExtraColumnRefiner(obj);
       } else if(statusOfLink == DEEPLINK.GLOBAL){
         obj[linked_wkName+'.'+linked_vtName] = selector;
         this._writeExtraColumnRefiner(obj);
       }
          
       //TBD: will the existed data need to be cleared? -- same Virtual Table
       this.getDataFromServer(this._model.get('vtname')).done(
       function() {
           if(chartInst.update) {
             chartInst.update({DATA_MANAGER: {SELECTOR: linkedSelector}});
           }
           this.bDeepLinking=false;
       });
     }
  };
  
  DataManager.prototype._checkDeepLink = function (linkedMessage, linked_vtName, linked_wkName) {
      
      var deepStatus = DEEPLINK.NONE,
          bSelector = (linkedMessage.constructor == Array),
          local_wkName = this._model.get('vtname'),
          local_vtName = this._getInferData('_default_table_key_'),
          family = this._getInferData('_family_');
      
      //if(linked_wkName == local_wkName) {
        if( linked_vtName == local_vtName ) {
          //check whether all columns have its actual data
          var  bret = this._isDeepUpdate(
                    (bSelector)? 'SELECTOR':'REFINER',
                    (bSelector)? linkedMessage: _.keys(linkedMessage)
                 );
          if(bret) {
              deepStatus = DEEPLINK.LOCAL;
          }
          //LOCAL :inside vt itself
        } else { //compare
          if(family && family.indexOf(linked_vtName) >=0) {
              deepStatus = DEEPLINK.WORKER;
              //WORKER : inside the same worker
          } 
        }
      //}
      /*else       
      if(family && family.indexOf(linked_wkname+'.'+linked_vtName) >=0) { //no use?
          deepStatus = DEEPLINK.GLOBAL;
          //GLOBAL: outside the worker
      }*/
      return deepStatus;
  };
  
  DataManager.prototype._isDeepUpdate = function (subkey, changed_columns) {
    
    var isdeep = false, 
        big= this._getInferData('_big_'),
        data_columns = _.keys(this.getData()[0]);
    
    //pre-condifion -- BIG.COLUMN/BIG.ROW will not use the only-server-columns for coloring
    
    if(subkey) { //called with changed refiner parameters
      
      if(this._ctrl.isHighlightMode()) {
          return false; //unnecessary to update the data from server --having got all data
      }
      
      //drilldown mode:  necessary to update the actual data if table is BIG-ROW/BOTH
      //MAPPER   : necessary to get the actual (&sampled) data  if still not
      //REFINER  : necessary to get the filterd (&sampled) data even if the filtering columns havn't actual data
      //SELECTOR : unnecessary to update the actual data
      
      switch (big) {
        case BIG.COLUMN://all rows have been got 
          isdeep = (_.without(changed_columns, data_columns).length >0) && (subkey == 'MAPPER');
          //+ or coloring changed
          break;
        case BIG.ROW://all columns have been got
          isdeep = (subkey == 'REFINER'); //how to set the samping column and accumulated columns?
          //+ or mapper changed or coloring changed ?
          break;
        case BIG.BOTH:
          isdeep = (_.without(changed_columns, data_columns).length >0) && (subkey == 'MAPPER');
          isdeep = isdeep || (subkey == 'REFINER');
          break;
        case BIG.NONE: break;
        default: break;
      }
    } else { //switch MODE:
      isdeep = (big !== BIG.NONE);
    }
    
    return isdeep;
  };
 
  /* link&update related functions  END */
  
  DataManager.prototype.setControl = function() {
    //this._ctrl.trigger("change:_show_ctrl_", arguments, this);
    if(arguments.length ==2 && arguments[0].constructor == String && 
       arguments[1].constructor == MouseEvent)
    {  //show row refiner control component
      this._ctrl.trigger("change:_show_ctrl_", arguments[0], arguments[1], this);
    }
    else
    if(arguments.length ==1  && arguments[0].constructor == MouseEvent) 
    { //show column refiner control component
       this._ctrl.trigger("change:_show_ctrl_", "$$$", arguments[0], this);
    }
  };
  
  DataManager.prototype.getControl = function(key) {
  
    var self=this,  $ctrl=$(), value;
    
    var dataTypes = this.getDataType(),
        dataRanges = this.getDataRange(),
        mappedColumns = this.getMappedColumns(),
        mappedNumberColumns = mappedColumns.filter(function(column){ return dataTypes[column]==='number';});
    
    if(key && key==="$$$") { //one column refiner control component
       $ctrl = $('<div>');
       $ctrl.data( { type: 'selection',
                     range: mappedNumberColumns,
                     value:  this.getColumnRefiner()
                   });
       return $ctrl;
    } else if(key) {  //one row refiner control component
        value = this.getRowRefiner(key);
        if(_.isEmpty(value)) {
          value = dataRanges[key];
        }
        $ctrl = $('<div>', {id: key});
        if(dataTypes[key] === 'number') { //slider
          $ctrl.data({type: 'slider', range: dataRanges[key], value: value});//TD: get current value
        } else {
          $ctrl.data({type: 'selection', range: dataRanges[key], value:  value}); 
        }
        return $ctrl;
    }
    else  {
      
      var $control_array = $('<div>');
      
      //set controls for mapped columns
      mappedColumns.forEach( function(column) {
        $ctrl = $('<div>', {id: column});
        if(dataTypes[column] === 'number') { //slider
          value = self.getRowRefiner(column);
          $ctrl.data({type: 'slider', range:dataRanges[column], value: (value)? value: dataRanges[column]});
        } else { //multi selection
          value = self.getRowRefiner(column);
          $ctrl.data({type: 'selection', range:dataRanges[column], value: (value.length>0)? value: dataRanges[column]});
        }
        $control_array.append($ctrl);    
      });
      
      //set columnRefiner control if possible
      if(mappedNumberColumns.length >0) {
        $ctrl = $('<div>');
        value = this.getColumnRefiner();
        $ctrl.data({ type: 'selection', 
                    range: mappedNumberColumns,
                    value: value});
        $control_array.append($ctrl);
      }
      
      //set controls for unmapped columns
      _.keys(dataTypes).filter(function(el){ return mappedColumns.indexOf(el) <0;}).forEach( function(column) {
        $ctrl = $('<div>', {id: column});
        if(dataTypes[column] === 'number') { //slider
          value = self.getRowRefiner(column);
          $ctrl.data({type: 'slider', range:dataRanges[column], value: (value)? value: dataRanges[column]});
        } else { //multi selection
          value = self.getRowRefiner(column);
          $ctrl.data({type: 'selection', range:dataRanges[column], value: (value.length>0)? value: dataRanges[column]});
        }
        $control_array.append($ctrl);    
      });
      
      return $control_array.children();
    }
  };
  
  return DataManager;
});