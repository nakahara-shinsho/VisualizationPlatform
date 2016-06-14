//status-less or statusful ?-- status-less
function Aggregator(jsonarray, types) {
  var self = this,
      LIMIT_NUM_OF_COLUMNS = 30, //max=32
      //d3 = require('d3'),
      _ = require('underscore'),
      crossfilter = require('crossfilter'),
      //$  = require('jquery-deferred'),
      keys = Object.keys(jsonarray[0]).filter(function(column){
        return types[column]=='number';
      }).splice(0, LIMIT_NUM_OF_COLUMNS); //the maximum number of dimensions is 16
  
  this.crossfilter = crossfilter(jsonarray);
  this.dimensions = {};
  this.grouping = null;
  this.prefilters = {};

  this.scale = function(size){
    return (size >4000) ? size/8:
           (size >3500) ? size/7: 
           (size >3000) ? size/6:
           (size >2500) ? size/5:
           (size >2000) ? size/4: 
           (size >1500) ? size/3:
           (size >1000) ? size/2: size ;
  };

  //create dimensions
  keys.forEach(function(column) {
    self.dimensions[column] = self.crossfilter.dimension(function(collection){
        return collection[column];
    });
  });
  
  this.clear = function() {
    if(this.grouping) {
      this.grouping.dispose();
      this.grouping = null;
    }
  };
  
  this.exec = function(options) {
    var currentArray = {};

    try {
 
      var spks = options._spk_  || {},
          refiner  =  options._where_  || {},
          selector =  options._select_ ;
      
      //add new dimension which are not still existed   
      
      //no necessary mapped column, return null (or all column?)
      if(_.isEmpty(selector)) {
        return {};
      }

      //clear unused refiner
      var clearfilters = {};

      if(!_.isEmpty(refiner)) {
        var refiner_keys = Object.keys(refiner);

        clearfilters = _.omit(this.prefilters, refiner_keys);

        //apply current refiner
        refiner_keys.forEach(function(column) {
          if(refiner[column][0]===null || refiner[column][1]===null) {
              clearfilters[column] = self.prefilters[column];  
          } else {
              var left = +refiner[column][0], right = +refiner[column][1];
              self.dimensions[column].filterFunction(function(d) {
                  return d >=left && d <right; //filter range is slower than fiter function
              });
              self.prefilters[column] = refiner[column].slice(0); //copy array
          }
        });
      } else { //highlight mode---statusful implementation
        clearfilters = this.prefilters;
      }
      
      //clear unnecessary filters
      if(!_.isEmpty(clearfilters)) {
        for(var column in clearfilters) {
          this.dimensions[column].filterAll();
        }
      }
 
      var spks_keys = Object.keys(spks);

      currentArray= this.dimensions[keys[0]].top(Infinity);
      if(spks_keys.length===0 || currentArray.length <20000) { //small data --> samlping is unnecessary  
        return currentArray;
      }
      
      //sampling
      if(spks_keys.length ==1 ) {
        var pk=spks_keys[0],  size = +spks[pk] /2;
        var max = this.dimensions[pk].top(1)[0][pk],
            min = this.dimensions[pk].bottom(1)[0][pk];
        this.grouping = this.dimensions[pk].group(function(d){
          return Math.floor(size* (d - min) /(max-min));
        });
      } else
      if(spks_keys.length >= 2 ) { //maximum two dimension samping
        var pk0=spks_keys[0],  size0 = self.scale(+spks[pk0]) ,
            max0 = this.dimensions[pk0].top(1)[0][pk0],
            min0 = this.dimensions[pk0].bottom(1)[0][pk0];
        var pk1=spks_keys[1],  size1 = self.scale(+spks[pk1]) ,
            max1 = this.dimensions[pk1].top(1)[0][pk1],
            min1 = this.dimensions[pk1].bottom(1)[0][pk1];
        var combsKey = pk0 +'|'+ pk1;
        if(!this.dimensions[combsKey]) {
          this.dimensions[combsKey] = self.crossfilter.dimension(function(d){
            return  Math.floor(size0* (d[pk0] - min0) /(max0-min0)) + '.' + 
                    Math.floor(size1* (d[pk1] - min1) /(max1-min1));
          });
        }
        this.grouping = this.dimensions[combsKey].group();
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
        return currentArray;
      } else {
        //spk_keys greater than 2   or equal 0
        return {};
      }
      //return currentArray;
    } catch (e) {
      console.log(e);
      return {};
    }
    return currentArray;
  }; //this.exec function end
  
}

module.exports= Aggregator;