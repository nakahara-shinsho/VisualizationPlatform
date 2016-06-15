function ReadFile4Bigdata (entrance, filename) {
  var BIG = {
        NONE: 0,
        ROW: 1,
        COLUMN: 2,
        BOTH: 3 
    };
  
  var fs = require('fs'),
      Aggregator = require('./Aggregator'),
      d3 = require('d3');

  {
    var startTime = (new Date()).getTime();
    var table = fs.readFileSync(entrance + filename, 'utf8'),
        format = filename.split('.').pop().toLowerCase();
    
    this.jsonarray = (format=='csv')? d3.csv.parse(table):
                    (format=='tsv')? d3.tsv.parse(table): table;
    console.log('CSV file read END: ' + ((new Date()).getTime() - startTime) + 'miliseconds');

    this.calculateInitValues(); //types, range
    console.log('calculate Init Values END: ' + ((new Date()).getTime() - startTime) + 'miliseconds');
    
    this.response = {_table_:{format: 'json'} };
    this.response._table_.types  = this.types;   //not change with options
    this.response._table_.ranges = this.ranges; //not change with options
    this.response._table_.big = BIG.ROW;
    
    this.aggregator = new Aggregator(this.jsonarray, this.types);
    
    console.log('prepare aggregator END: ' + ((new Date()).getTime() - startTime) + 'miliseconds');

  }
}

ReadFile4Bigdata.prototype.calculateInitValues = function() {
    var self=this,
        itypes={},
        header = Object.keys(this.jsonarray[0]);
    
    //initialize itypes value
    header.forEach(function(column){
      itypes[column] = true; //is number
    });

    this.jsonarray.forEach(function(row, index, array){
      header.forEach(function(column){
        if(itypes[column]) { //isNumber value
           itypes[column] = /*!isNaN(+row[column]) &&*/ isFinite(row[column]); //check and set isString value
        }
      });
    });

    header = header.filter(function(column){ return itypes[column];});

    //ranges
    var ranges = {};
    header.forEach(function(column){
      ranges[column] = [Infinity, -Infinity];
    });
    this.jsonarray.forEach(function(row, index, array){
      header.forEach(function(column){
          row[column] = +row[column];
          if(ranges[column][0] > row[column]) {ranges[column][0] = row[column];  } //min value
          if(ranges[column][1] < row[column]) {ranges[column][1] = row[column];  } //max value
      });
    });
    this.ranges = ranges;

    //types
    var types = {};
    header.forEach(function(column){
      types[column] = 'number';
    });
    this.types = types;
    return;
  };
  
  ReadFile4Bigdata.prototype.vts = function(wk_name) {
      return [wk_name];
  };
  
  ReadFile4Bigdata.prototype.syn = function(options, entrance, filename) {
    console.log('request options:  ' + JSON.stringify(options) );
    var startTime = (new Date()).getTime();
    this.response._table_.filled = this.aggregator.exec(options);
    console.log('aggregating process END: ' + ((new Date()).getTime() - startTime) + 'miliseconds');
    return this.response;
  };
  
  this.clear = function() {
    if(this.aggregator.clear) {
      this.aggregator.clear();
    }
  };


module.exports = ReadFile4Bigdata;