function GanttChartTest () {
  
  //private members ( static variables)
  var fs = require('fs');
  var $ = require('jquery-deferred');
  
  //public member for sync call
  this.syn = function(options) {
    console.log('request options:  ' + JSON.stringify(options)  );
    var fs = require('fs');
    var vt = {data:{}};
    try {
      vt.data.format='csv';
      vt.data.filled = fs.readFileSync(__dirname+'/data/gantt_data1.csv', 'utf8');
    } catch (err) {
      vt.data.format='error';
      vt.data.filled = err.message;
    }
    return vt;
  };

  //public member for asyn call
  this.asyn = function(options) {
    console.log('request options:  ' + JSON.stringify(options)  );
      
    var deferred = $.Deferred();
    var vt = { data: {}, title: 'gantt chart test'};

    fs.readFile(__dirname+'/data/gantt_data1.csv', 'utf8', function(err, text){
      if(err){
        vt.data.format = 'error';
        vt.data.filled = err;
        deferred.reject(vt);
      }else{
        vt.data.format = 'csv';
        vt.data.filled = text;
        deferred.resolve(vt);
      }
    });
    return deferred.promise();
  };
}

module.exports = new GanttChartTest();