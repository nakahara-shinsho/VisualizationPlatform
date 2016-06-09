function ReadFile4Bigdata () {
  var BIG = {
        NONE: 0,
        ROW: 1,
        COLUMN: 2,
        BOTH: 3 
    };
  
  var fs = require('fs'),
      Aggregator = require('./Aggregator'),
      d3 = require('d3');
      
  this.init = function(entrance, filename) {
    
    var table = fs.readFileSync(entrance + filename, 'utf8'),
        format = filename.split('.').pop().toLowerCase(),
        jsonarray = (format=='csv')? d3.csv.parse(table):
                    (format=='tsv')? d3.tsv.parse(table): table;
    
    var header = Object.keys(jsonarray[0]),
        types  = this.types(jsonarray, header),
        ranges = this.ranges(jsonarray, header, types);
    
    this.response = {_table_:{format: 'json'} };
    this.response._table_.types  = types;   //not change with options
    this.response._table_.ranges = ranges; //not change with options
    this.response._table_.big = BIG.ROW;
    //this.response._table_.family = null;
    this.aggregator = new Aggregator(jsonarray, types);
    
    return this;
  };
  
  this.types = function(jsonarray, header) {
    var types = {};
    header.forEach(function(column){
       types[column] =  column.endsWith(".number")? 'number' :
                        column.endsWith(".string")? 'string' :
                        column.endsWith(".date")? 'date' : 'string'; 
    });
    
    jsonarray.forEach(function(row, index, array){
      for(var column in types) {
        if(types[column] =='number') {
          row[column] = +row[column];
        }
      }
    });   
    
    return types;
  };
  
  this.ranges = function(jsonarray, header, types) {
    header.forEach(function(column){
      if(types[column] == 'number') {
        d3.extent(jsonarray.map(function(d){
           return d[column];
        }));
      } else {
        d3.map(jsonarray, function(d){
           return d[column];
        }).keys();  
      }
    });
  };
  
  this.vts = function(wk_name) {
      return [wk_name];
  };
  
  this.syn = function(options, entrance, filename) {
    console.log('request options:  ' + JSON.stringify(options) );
    this.response._table_.filled = this.aggregator.exec(options);
    return this.response;
  };
  
  this.clear = function() {
    if(this.aggregator.clear) {
      this.aggregator.clear();
    }
  };
}

module.exports = ReadFile4Bigdata;