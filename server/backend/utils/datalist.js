function MyClass () {

  //private members ( static variables)
  var fs   = require('fs');
  var path = require('path');
  var $    = require('jquery-deferred');
  
  //public member for asyn call
  this.vts = function(wk_name) {
      return [wk_name];
  };
  
  this.asyn = function(options, dataPath) {
    console.log('request options:  ' + JSON.stringify(options)  );
    console.log('data path      :  ' + dataPath );
    var deferred = $.Deferred();
    var vt = {};
    // [GLOB] Project
    var data = {list:[]};
    try { 
      var list = fs.readdirSync(dataPath);
      for(var i=0; i<list.length; i++){
        var fullPath = dataPath + list[i];
          var st = fs.statSync(fullPath);
          if(st.isDirectory(fullPath)){
            var tmp = {
              name          : list[i],
              modified_time : fs.statSync(fullPath).mtime
            };
	    console.log(list[i]);
            data.list.push(tmp);
          }
      }
    }catch(e){
        console.log("Show DIR " + __dirname);
        console.log("error:"+e.message);
        data.list.push({name:'dummy', modified_time: (new Date()).toLocaleDateString()});
    }
    vt.format = 'json';
    vt.filled = data;
    deferred.resolve(vt);
    return deferred.promise();
  };
}

module.exports = new MyClass();
