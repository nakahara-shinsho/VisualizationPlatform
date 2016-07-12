define(['ctrl/COMMON'], function (COMMON) {
 var DesignManager = function(boardModel, chartCtrl){
     
      this._model = boardModel;
      this._ctrl  = chartCtrl;
      this._$controls= $('<div/>');//container
 };
 
 DesignManager.prototype._set =  function(changedObj, options) {
    if(changedObj) {
        // trigger 'change' to save to server with silent:true(default) in options
        this._model.set('ioattrs', $.extend(true, {}, this._get(), changedObj), options ); 
        // update chart only if it is timing to save to server
        if(!options || !options.silent) {
            this.designUpdating(changedObj);
        }
    }
 };
 
 DesignManager.prototype._get =  function(id) {
   var ret= null,
       attrs = COMMON.makeObject(this._model.get('ioattrs'), {});
   if(id) {
       ret = attrs[id];
   } else {
       ret = attrs;
   }
   return  ret;
 };
 
 DesignManager.prototype.clearAll = function() {
     this._model.set({'ioattrs': {}}, {silent: true});
     this._$controls= $('<div/>');
     this._ctrl.trigger("change:_save_model_");
 };
 
 //create DOM before initialize, and updating data show design panel
 DesignManager.prototype.setTemplate = function(tpl) {
      var self = this,
          $tpl = $(_.template(tpl)())
            .filter(function(){ return $(this).is('div[id]'); });
      
      //set the inital values in template into _designModel
      $tpl.each(function(index){
        var val = $(this).attr('data-value');
        if(val) {
          self.setValue($(this).attr('id'), val );
        }
      });
      
      this._$controls.append($tpl);
    };
    
  DesignManager.prototype.getControl = function(id) {
    var self = this,
        selector = (id)? "div[id='"+ id + "']" : "div[id]";
    //exclude components of link panel
    var $controls = self._$controls.find(selector);
    $.each($controls, function(index, ctrl) {
      var currval = self.getValue($(ctrl).attr('id'));//value from model
      $(ctrl).data('value', currval);
    });
    return $controls;
  };

  DesignManager.prototype._mergeControl_ = function(key, dataset) {
      var  $ctrl = this._$controls.find("div[id='"+ key+ "']");
      if( $ctrl.length <=0 ) {
        $ctrl = $('<div/>', {id: key});
        this._$controls.append($ctrl);
      }
      var new_dataset = $.extend(true,{}, $ctrl.data(), dataset);
      $ctrl.data(new_dataset);
      //add or update io variable
      if(dataset.value !== undefined && dataset.value !== null) {
        this.setValue(key, dataset.value);
      }
    };
  
  DesignManager.prototype.setControl = function() {
      if(arguments.length <=0) return;

      if(arguments[0].constructor == Object) {
        _.each(arguments[0], function(item, key){
          this._mergeControl_(key, item);
        });
      }
      else if(arguments[0].constructor == String) {
         if( !arguments[1] ) {
         }
         else if(arguments[1].constructor== MouseEvent) {
           this._ctrl.trigger("change:_show_ctrl_", arguments[0], arguments[1], this);
         }
         else if(arguments[1].constructor == Object) {
            this._mergeControl_(arguments[0], arguments[1]);
         }
      }
  };
  
  DesignManager.prototype.designUpdating = function(changedObj) {
    this._ctrl.chartInstance().update({ DESIGN_MANAGER: changedObj} );
  };
  
  DesignManager.prototype.setValue = function() {
  
     var hasRendered = this._ctrl.hasRendered(), 
         hasInited   = this._ctrl.hasInited(),
         toBeAdded, obj;
     
     if(arguments.length <=0) return;
     
     if(arguments[0].constructor == Object) {                   
        if(hasRendered) {
            toBeAdded = _.pick(arguments[0], _.keys(this._get())); 
            if(!_.isEmpty(toBeAdded)) { //only set existed attributes
              this._set(toBeAdded);  //the general 'change' event is triggered
            }
         } else if(hasInited ) { //rendering
            toBeAdded = _.pick(arguments[0], _.keys(this._get())); 
            if(!_.isEmpty(toBeAdded)) { 
              this._set(toBeAdded, {silent: true});
            }
         } else { //initializing
            toBeAdded = _.omit(arguments[0], _.keys(this._get())); //only set new attributes
            if(!_.isEmpty(toBeAdded)) { 
              this._set(toBeAdded, {silent: true});
            }
        }
     } else {
         if( hasRendered ) {
            if(_.has(this._get(), arguments[0])) {
              obj = {}; obj[arguments[0]]=arguments[1];
              this._set(obj);// general 'change' event is triggered
            }
          } else if(hasInited) { //rendering
            if( _.has(this._get(), arguments[0])) {
              obj = {}; obj[arguments[0]]=arguments[1];
              this._set(obj, { silent:true });// general 'change' event isn't triggered
            }
          }
          else { //initializing
            if(! _.has(this._get(), arguments[0])) { //only the new attribute
              obj = {};  obj[arguments[0]]=arguments[1];
              this._set(obj, { silent:true });// general 'change' event isn't triggered
            }
          } 
     }
  };
  
  DesignManager.prototype.getValue = function(id) {
      return this._get(id);
  };
 
  DesignManager.prototype.mode = function(mode) {
    if(mode) {
      //this._set({'mode': mode},{silent: true});
      this._model.set('ioattrs', $.extend(true, {}, this._get(), {'mode': mode}));
    }
    return this._get('mode');
 };
 
 return DesignManager;
});
