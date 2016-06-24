define(['ctrl/ColorManager', 'ctrl/DesignManager', 'ctrl/DataManager'], 
  function (ColorManager, DesignManager,DataManager) {
  var MyClass = function (boardModel) {
      var self = this;
      
      //for trigger event 
      _.extend(this, Backbone.Events);// event triiger, on & listenTo 
      
      this._size_ = {width:0 , height: 0}; 
      
      //for design manager
      this._designManager_ = new DesignManager(boardModel, this);// add 'this' as 'parent' parameter
      
      //for data manager
      this._dataManager_ = new DataManager(boardModel, this);// add 'this' as 'parent' parameter
      
      //for color manager
      this._colorManager_ = new ColorManager(boardModel, this);// add 'this' as 'parent' parameter
     
      this.RENDER_STATUS = {
        EMPRY: 0,
        INITed: 1,
        RENDERing: 2,
        RENDERed: 3,
        UPDATing: 4,
        UPDATed: 5
      };
  };
  
   //add the link to colorManager for access from widget.io
  MyClass.prototype.colorManager = function() {
    return this._colorManager_; 
  };
  
  MyClass.prototype.designManager = function() {
    return this._designManager_; 
  };
  
  MyClass.prototype.dataManager = function() {
    return this._dataManager_; 
  };
  
  MyClass.prototype.chartInstance = function() {
    return this._widget_; 
  };
  
  MyClass.prototype.hasRendered = function () {
    return (this._RenderStatus_ == this.RENDER_STATUS.RENDERed) ||
           (this._RenderStatus_ == this.RENDER_STATUS.UPDATed); 
  } ;
  
  MyClass.prototype.hasInited = function () {
    return this._RenderStatus_ >= this.RENDER_STATUS.INITed && 
        (this._RenderStatus_ != this.RENDER_STATUS.RENDERed ||this._RenderStatus_ != this.RENDER_STATUS.UPDATed); 
  } ;
  
  //for design panel
  MyClass.prototype.update = function(changedAttrs) {
      if(this._widget_.update) { 
        this._widget_.update(changedAttrs);
      }
   };
  
  //get chart widget and its corresponding data
  MyClass.prototype.getContent= function (vtname, vttype, screenContext, sizeObj) {
      var self = this;
      return self.getChartLib(vttype).then(
        function() {
          return self._dataManager_.getDataFromServer(vtname, screenContext, sizeObj);
        });
  };

  MyClass.prototype.getChartLib= function(type) {
      var self = this;
      var deferred = $.Deferred();
      if (self.widget) {
        deferred.resolve();
      } else {
        if(!type) {
          deferred.reject('Error:: vt type is undefined !');
        } else {
          var location = 'vis/'+ type + '/main';
          require([location], function (ChartLibClass) {
            self._RenderStatus_ = self.RENDER_STATUS.EMPTY;
            self._widget_ = new ChartLibClass(self);
            self._RenderStatus_ = self.RENDER_STATUS.INITed;
            //overwrite function
            self.overwriteWidget();
            deferred.resolve();
          });
        }
      }
      return deferred.promise();
  };
  
  MyClass.prototype.size = function (){
    return this._size_;
  };
  
  MyClass.prototype.render = function(width, height) {
    this._size_.width= width; this._size_.height= height;
    if(this._widget_.render){
      return this._widget_.render(width, height);
    }
    return null;
  };
  
  MyClass.prototype.resize = function(width, height) {
    this._size_.width= width; this._size_.height= height;
    if(this._widget_.resize){
      this._widget_.resize(width, height);
      return true;
    }
    return false;
  };
  
  MyClass.prototype.overwriteWidget= function () {
    var self = this;
    //start render overwrite
    if(this._widget_.render) {
      var origRenderFunc = this._widget_.render;
      this._widget_.render = function() {
        var ok = false;
        if(self._widget_.validate) {
          ok =self._widget_.validate();
        }else {
          ok = self.dataManager().validate();
        }
        if(ok) {
          self._RenderStatus_ = self.RENDER_STATUS.RENDERing;
          var ret = origRenderFunc.apply(this, arguments);
          self.trigger("change:_save_model_");
          self._RenderStatus_ = self.RENDER_STATUS.RENDERed;
          return ret;
        } else {
          alert('Chart Data error when validating!');
          return null;
        }
      };
    }//render overwrite
    
    //start update overwrite
    if(this._widget_.update) {
      var origUpdate = this._widget_.update;
      this._widget_.update = function(changed) {
        self._RenderStatus_ = self.RENDER_STATUS.UPDATing;
        var chart_dom = origUpdate.apply(this, arguments);
        if(chart_dom && chart_dom.tagName.toLowerCase()==='svg') {
          //the content size may have changed
          var bbox = chart_dom.getBBox(),
              actual_viewBox = [bbox.x, bbox.y, bbox.width, bbox.height];
           chart_dom.setAttribute("viewBox", actual_viewBox);
        }
        self._RenderStatus_ = self.RENDER_STATUS.UPDATed;
      };
    }//update overwrite 
  };
 
 MyClass.prototype.mode = function(mode) {
    if(this._widget_ && this._widget_.mode){
      return this._widget_.mode(mode);
    } else { //default implementation
      return this._designManager_.mode(mode);
    }
 };
 
 MyClass.prototype.setHighlightMode = function () {
    return this.mode('highlight'); 
 };
 
 MyClass.prototype.setDrilldownMode = function () {
    return this.mode('drilldown'); 
 };
 
 MyClass.prototype.isHighlightMode = function () {
    return this.mode()==='highlight'; 
 };
 
 MyClass.prototype.isDrilldownMode = function () {
    return this.mode()==='drilldown';   
 };
 
 return MyClass;
});
