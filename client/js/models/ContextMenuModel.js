define(['text!vis/config.json'], function(cts){
  
  function MyClass() {
      this.url = 'api/vts';
  }
  
  MyClass.prototype.getDatalistOfChart = function(vttype) {
    var deferred = $.Deferred(),
        vtattrs = vttype.split('/'),
        data = {kind: vtattrs[0], chart: vtattrs[1]};
    
    $.ajax({type: 'get', cache: false, url: this.url, timeout:10000, data: data}).then(function (datalist) {
        var items = {};
        Object.keys(datalist).forEach(function(wkname){
          if(datalist[wkname].length <=1 ) {
            items[wkname] = {name: wkname};
          } else {
            var obj= {};
            datalist[wkname].forEach(function(vtname){
              obj[ wkname+'.'+vtname] = {name: vtname};
            });
            items[wkname] = {name: wkname, items: obj };
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
    var tempKey, tempName;

    $.ajax({type: 'get', cache: false, url: this.url}).then(function (jsondata) {
      console.log('Virtual Tables: ',jsondata);
      $.each(jsondata, function(ctg, vts){
        switch (ctg) {
          case 'TABLE':
            //wkname
            Object.keys(vts).forEach(function(table){
              tableItems[table]= {name: table };//
              if(self.modules[ctg]) {
                self.modules[ctg].forEach(function(me){
                  if(me.constructor == Object) { //customized path
                    tempKey  = me.path+'/'+table;
                    tempName = me.type;
                  } else { //default path (chart's type == chart's path)
                    tempKey = 'TABLE/'+ me +'/'+table;
                    tempName = me;
                  }
                  if(!tableItems[table].items){
                    tableItems[table].items ={};
                  }
                  tableItems[table].items[tempKey] = {name: tempName};
                });
              }
            });
            break;
          case 'TREE':
            Object.keys(vts).forEach(function(table){
              treeItems[table]= {name: table };
              if(self.modules[ctg]){
                self.modules[ctg].forEach(function(me){
                  if(me.constructor == Object) {
                    tempKey = me.path+'/'+table;
                    tempName = me.type;
                  } else {
                    tempKey = 'TREE/'+me+'/'+table;
                    tempName = me;
                  }
                  if(!treeItems[table].items){
                    treeItems[table].items ={};
                  }
                  treeItems[table].items[tempKey] = {name: tempName};
                });
              }
            });
            break;
          case 'STREAM':
            Object.keys(vts).forEach(function(table){
              streamItems[table]= {name: table };
              if(self.modules[ctg]){
                self.modules[ctg].forEach(function(me){
                  if(me.constructor == Object) {
                    tempKey = me.path+'/'+table;
                    tempName = me.type;
                  } else {
                    tempKey = 'STREAM/'+me+'/'+table;
                    tempName = me;
                  }
                  if(!streamItems[table].items){
                    streamItems[table].items ={};
                  }
                  streamItems[table].items[tempKey] = {name: tempName};
                });
              }
            });
            break;

          default : //'advanced'
            $.each(vts, function (type, names){
              names.forEach(function(name) {
                if(!advancedItems[type]){ //type--GanttChart
                  advancedItems[type] = { name: type, items: {}};
                }
                if(self.modules[type]){
                  tempKey = (self.modules[type].path)? self.modules[type].path : type;
                  advancedItems[type].items[ tempKey +'/'+name] = {name: name};
                } else {
                  //advancedItems[type].disabled = true;
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
