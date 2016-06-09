//status-less or statusful ?-- status-less
function Aggregator(jsonarray, types) {
  var self = this,
      LIMIT_NUM_OF_COLUMNS = 32,
      d3 = require('d3'),
      _ = require('underscore'),
      crossfilter = require('crossfilter'),
      $  = require('jquery-deferred'),
      keys = Object.keys(jsonarray[0]).splice(0, LIMIT_NUM_OF_COLUMNS); //the maximum number of dimensions is 16  
  
  this.crossfilter = crossfilter(jsonarray);
  this.dimensions = {};
  this.grouping = null;
  
  //create dimensions
  keys.forEach(function(column){
    self.dimensions[column] = self.crossfilter.dimension(function(collection){
        return collection[column];
    });
  });
  
  this.clear = function() {
    for(var column in this.dimensions) {
      this.dimensions[column].filterAll();
    }
    if(this.grouping) {
      this.grouping.dispose();
    }
  };
  
  this.exec = function(options) {
    try {
      var spks = options._spk_  || {},
          refiner  =  options._where_  || {},
          selector =  /*options._select_ ||*/ keys;         
      var currentArray = {};
      //add new dimension which are not still existed   
      
      //refining
      var refiner_keys = Object.keys(refiner);
      refiner_keys.forEach(function(column){
        if(types[column]=='number') {
          self.dimensions[column].filterRange([+refiner[column][0], +refiner[column][1]]);
        } else {
          self.dimensions[column].filterFunction(function(d){
            return refiner[column].indexOf(d) >= 0;
          });
        }
      });
      
      currentArray= this.dimensions[keys[0]].top(Infinity);
            
      //if(!spks ) { //spks do not exist --> sampling is unnecessary
      //  return currentArray;
      //}
      
      var vsize = 1, spks_keys = Object.keys(spks);
      spks_keys.forEach(function(pk){
        vsize *= +spks[pk];
      });
      
      //if the size of filtered records is less than vsize, then return without sampling
      if(vsize >= currentArray.length) { //small data --> samlping is necessary
        return currentArray;
      }

      //sampling
      this.grouping = null;
      if(spks_keys.length ==1 ) {
        var pk=spks_keys[0],  size = +spks[pk],
            max = this.dimensions[pk].top(1)[0][pk],
            min = this.dimensions[pk].bottom(1)[0][pk];
        this.grouping = this.dimensions[pk].group(function(d){
          return Math.floor(size* (d - min) /(max-min));
        });
      } else
      if(spks_keys.length == 2 ) {
        var pk0=spks_keys[0],  size0 = +spks[pk0],
            min0 = this.dimensions[pk0].top(1)[0][pk0],
            max0 = this.dimensions[pk0].bottom(1)[0][pk0];
        var pk1=spks_keys[1],  size1 = +spks[pk1],
            min1 = this.dimensions[pk1].top(1)[0][pk1],
            max1 = this.dimensions[pk1].bottom(1)[0][pk1];
        var combsKey = pk0 +'|'+ pk1;
        if(!this.dimensions[combsKey]) {
          this.dimensions[combsKey] = self.crossfilter.dimension(function(d){
            return  Math.floor(size0* (d - min0) /(max0-min0)) + '.' + 
                    Math.floor(size1* (d - min1) /(max1-min1));
          });
        }
        this.grouping = this.dimensions[pk1].group(function(d){
            return Math.floor(size* (d - min) /(max-min));
        }); 
      }
      if(this.grouping) {
        this.grouping.reduce(
          function reduceAdd(p,v){
            selector.forEach(function(column) {
              p[column].total +=  v[column];
              p[column].count += 1;
            });
            return p;
          },
          function reduceRemove(p,v){
            selector.forEach(function(column) {
              p[column].total -=  v[column];
              p[column].count -= 1;
            });
            return p;
          },
          function reduceInitial(){
            var p= {};
            selector.forEach(function(column) {
              p[column] = {total:0, count:0};
            });
            return p;
          }
        );
        currentArray = this.grouping.all().map(
          function(p) {
            var obj ={};
             selector.forEach(function(column) {
                    obj[column] = p.value[column].total / p.value[column].count;
             });
             return obj;
          }
        );//map end   
      } else {
        //spk doesnot exist or greater than 2
      }
      return currentArray;
    } catch (e) {
      console.log(e);
    }
      return {};
    }; //this.exec function end
  //return this;
}

module.exports= Aggregator;
