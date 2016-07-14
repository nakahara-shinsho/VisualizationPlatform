define(['text!vis/config.json'], function(cts){
  
  function MyClass() {
      this.url = 'api/vts';
  }
  
  MyClass.prototype.getDatalistOfChart = function(vttype) {
    var deferred = $.Deferred(),
        vtattrs = vttype.split('/'),
        data = {kind: vtattrs[0], chart: vtattrs[1]};
    
    $.ajax({type: 'get', cache: false, url: this.url, timeout:10000, data: data}).then(function (wks) {
        var items = {};
        _.each(wks, function(vts, wkname){
          if(vts.length > 1 ) {
            var obj= {};
            vts.forEach(function(vtname) {
              obj[wkname+'.'+vtname] = {name: vtname};
            });
            items[wkname] = {name: wkname, items: obj };
          } else if(vts.length >0) {
            items[wkname+'.'+vts[0] ] = {name: wkname};
          } 
        });
        console.log(items);
        return deferred.resolve({items: items});
    });
    
    return deferred.promise();
  };
  
  MyClass.prototype.config = function() {
    var self = this;
    var jsonstr= cts.replace(/\/\*.+?\*\/|\/\/.*(?=[\n\r])/g, '') //remove comment 
                    .replace(/'/g, '"') //change single quote to double quotes
                    .replace(/(['"])?([\a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');//add double quote surrounding KEYs.
    self.modules = JSON.parse(jsonstr);
    return this;
  };
  
  MyClass.prototype.addChartLibs = function(ctg, wkvtName){
    var tempKey, tempName, items ={};
    if(this.modules[ctg]) {
       this.modules[ctg].forEach(function(me) {
         if(me.constructor == Object) { //customized path
            tempKey  = me.path+'/'+wkvtName;
            tempName = me.type;
         } else { //default path (chart's type == chart's path)
            tempKey = ctg+ '/'+ me +'/'+ wkvtName;
            tempName = me;
         }
         items[tempKey] = {name: tempName};
      });
    }
    return items;
  };

  MyClass.prototype.getDatalistOfCharts = function(){
    var self = this;
    var contextMenu={}, advancedItems = {}, treeItems={}, tableItems={}, streamItems={};
    var addItems ={
          ADVANCED: { name: 'Advanced chart' },
          TABLE: { name: 'Basic chart for table..'  },
          TREE:  { name: 'Basic chart for tree ..' },
          STREAM:{ name: 'Basic chart for time series...'  }
      };
    var deferred = $.Deferred();
  

    $.ajax({type: 'get', cache: false, url: this.url}).then(function (jsondata) {
      console.log('Virtual Tables: ',jsondata);
      $.each(jsondata, function(ctg, wks){
        switch (ctg) {
          case 'TABLE':
          case 'TREE':
          case 'STREAM':
            //wkname
            _.each(wks, function(vts, wkname) {
              if(vts.length > 1 ) {
                var obj= {},wkvtName;
                vts.forEach(function(vtname) {
                  wkvtName = wkname+'.'+vtname; 
                  obj[wkvtName] = {name: vtname, items: self.addChartLibs(ctg, wkvtName)};
                });
                tableItems[wkname] = {name: wkname, items: obj};
              } else if(vts.length > 0) {
                tableItems[wkname+'.'+ vts[0]] = {name: wkname, items: self.addChartLibs(ctg, wkname)};
              }
            });
            break;
         
          default : //'advanced'
            $.each(wks, function (type, names){
              names.forEach(function(name) {
                if(!advancedItems[type]){ //type--GanttChart
                  advancedItems[type] = { name: type, items: {}};
                }
                if(self.modules[type]){
                  tempKey = (self.modules[type].path)? self.modules[type].path : type;
                  advancedItems[type].items[ tempKey +'/'+name] = {name: name};
                } else {
                  advancedItems[type].items[ type+'/'+name] = {name: name, disabled: true};
                }
              });
            });
            break;
        }
      });//each end
      
      if(Object.keys(advancedItems).length){
        addItems.ADVANCED.items = advancedItems;
      }else{
        addItems.ADVANCED.disabled = true;
      }
      
      if(Object.keys(treeItems).length){
        addItems.TREE.items = treeItems;
      }else{
        addItems.TREE.disabled = true;
      }
      
      if(Object.keys(tableItems).length){
        addItems.TABLE.items = tableItems;
      }else{
        addItems.TABLE.disabled = true;
      }
      
      if(Object.keys(streamItems).length){
        addItems.STREAM.items = streamItems;
      }else{
        addItems.STREAM.disabled = true;
      }
      contextMenu.items = addItems;
      
      return deferred.resolve(contextMenu);
    });
    return deferred.promise();
  };

  return MyClass;
});
