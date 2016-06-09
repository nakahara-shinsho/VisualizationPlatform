function MyClass () {

  //private members ( static variables)
  var fs   = require('fs');
  var path = require('path');
  var $    = require('jquery-deferred');
  //public member for asyn call
  this.asyn = function(options, dataPath) {
    console.log('request options:  ' + JSON.stringify(options)  );
    console.log('data path      :  ' + dataPath );
    var deferred = $.Deferred();
    var vt = {};
    // [GLOB] Project
    var data = {list:[]};
    var list = fs.readdirSync(dataPath);
    for(var i=0; i<list.length; i++){
      var fullPath = dataPath + list[i];
      try{
        var st = fs.statSync(fullPath);
        if(st.isDirectory(fullPath)){
          var tmp = {
            name          : list[i],
            modified_time : fs.statSync(fullPath).mtime
          };
          data.list.push(tmp);
        }
      }catch(e){
        console.log("error:"+e.message);
      }
    }
    vt.format = 'json';
    vt.filled = data;
    deferred.resolve(vt);
    return deferred.promise();
  };
}

module.exports = new MyClass();
