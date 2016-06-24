//status-less or statusful ?-- status-less
function Aggregator(jsonarray, itypes) {
  var self = this,
      LIMIT_NUM_OF_COLUMNS = 30, //max=32
      LIMIT_NUM_OF_ROWS = 30000,
      //d3 = require('d3'),
      _ = require('underscore'),
      crossfilter = require('crossfilter');
      
  this.crossfilter = crossfilter(jsonarray);
  this.dimensions = {};
  this.prefilters = {};
  this.prespkobj = {};
  
  this.scale = function(size){ // it it necessary to consider the size of spks ?
    
    return (size >2100) ? 1000:
           (size >1100) ? 800: 
           (size >500) ? 500: size ;
  };

  this.findOneDimKey = function() {
    return Object.keys(this.dimensions)[0];
  };

  this.findOneNumberDimKey = function() {
    var key = null;
    for(var column in this.dimensions) {
      if(itypes[column]) {
        key = column;
        break;
      }
    }
    return key;
  };
  

  this.clear = function() {
    if(this.grouping) {
      //this.grouping.dispose();
      //this.grouping = null;
    }
  };
  
  this.createDimensions = function(dimKeys, comboPK) {
    
    var dimsLength2Keep = dimKeys.length,
        clearColumns = _.difference(Object.keys(this.dimensions), dimKeys);

    if( dimKeys.indexOf(comboPK) <0 ) {
       dimsLength2Keep +=1;
    }

    if( (dimsLength2Keep + clearColumns.length) > LIMIT_NUM_OF_COLUMNS ) { //clear all dimensions excepts the keys and current pk
      clearColumns.forEach(function(column) {
         self.dimensions[column].dispose();
         delete self.dimensions[column];
         if(self.prefilters[column]) {
           delete self.prefilters[column];
         }
      });
    }

    //add new dimension which are not still existed (except comboKey)
    dimKeys.forEach(function(column) {
        if(!self.dimensions[column] && Object.keys(self.dimensions).length < LIMIT_NUM_OF_COLUMNS) {
          self.dimensions[column] = self.crossfilter.dimension(function(collection){
              return collection[column];
          });
        }
    });
  }; //create  end

  this.exec = function(options) {
    var tmpArray, startTime = new Date().getTime();

    var spkObject = _.mapObject(_.pick(options._spk_ || {}, function(value, key){return itypes[key];}), function(val, key) {
            return self.scale(+val);
          }),
        refiner  =  options._where_  || {},
        selector =  (options._select_=='*')? Object.keys(itypes): options._select_ , //the rendering column
        groupby = options._groupby_;
    
    var hasGroupBy = !_.isEmpty(groupby),
        spks = Object.keys(spkObject),
        comboPK = spks.sort().join('|'), //
        refinerKeys = Object.keys(refiner);
    
    var currentArray = {}, clearfilters = {};
    
    try {
      //firstly, check and send back empty data for initializing data mapping panel
      if(!selector) { 
        return {};
      } 
      
      this.createDimensions(_.union(refinerKeys, spks), comboPK); //create necessary dimensions
      console.log( 'createDimension(ms): ' + (new Date().getTime() - startTime));

      //no refiner, no spks -- TBD: how to process long columns? 
      if(Object.keys(this.dimensions).length <=0) {
        console.error('(1)sending all the data without sampling');
        return  (jsonarray.length> LIMIT_NUM_OF_ROWS)? _.sample(jsonarray, LIMIT_NUM_OF_ROWS): jsonarray;
      }

      var clearColumn;
      if(!_.isEmpty(refiner)) {
        
        clearfilters = _.omit(this.prefilters, refinerKeys);
        
        //clear unused filters
        if(!_.isEmpty(clearfilters)) {
          for(clearColumn in clearfilters) {
            this.dimensions[clearColumn].filterAll();
            delete this.prefilters[clearColumn];
          }
        }
        console.log( 'clearDimension(ms) : ' + (new Date().getTime() - startTime));
        //apply current refiner
        var left, right;
        refinerKeys.forEach(function(column) {
          if(_.isNull(refiner[column][0]) || _.isNull(refiner[column][1])) {
              clearfilters[column] = self.prefilters[column];
          } else if(!_.isEqual(self.prefilters[column], refiner[column])) {
              if(itypes[column]) {
                left  = +refiner[column][0];
                right = +refiner[column][1];
                //self.dimensions[column].filterRange([left, right]);
                self.dimensions[column].filterFunction(function(d) {
                    return d >=left && d <right; //filter range is slower than fiter function
                });
              }
              else { //'string'
                var rangeset = refiner[column];
                self.dimensions[column].filterFunction(function(d) {
                    return rangeset.indexOf(d) >=0; //filter range is slower than fiter function
                });
              }
              self.prefilters[column] = refiner[column].slice(0); //copy array [min, max]
          }
        });
        console.log( 'filter(ms): ' + (new Date().getTime() - startTime));
      } else { //highlight mode or inital chart
        clearfilters = this.prefilters;
        //clear unnecessary filters
        if(!_.isEmpty(clearfilters)) {
          for(clearColumn in clearfilters) {
            this.dimensions[clearColumn].filterAll();
            delete this.prefilters[clearColumn];
          }
        }
        console.log( 'clearDimension(ms): ' + (new Date().getTime() - startTime));
      }
      
      if(this.crossfilter.groupAll().value() <= LIMIT_NUM_OF_ROWS) { //small data --> samlping is unnecessary  
        return this.dimensions[refinerKeys[0] || this.findOneDimKey()].top(Infinity);
      }
      
      var grouping=null;
      var numberKey = this.findOneNumberDimKey();
      if(!numberKey) {
        //return only the groupby result: TBD
        if(hasGroupBy) {
            var tmpObj, tmpKeyObj, comboGroupKey = '|'+ groupby.join('|') +'|';
            if(!this.dimensions[comboGroupKey]) {
              this.dimensions[comboGroupKey] = self.crossfilter.dimension(function(d) {
                tmpObj = {};
                return JSON.stringify(groupby.map(function(column){tmpObj[column] = d[column];}) );
              });
            }
            grouping = this.dimensions[comboGroupKey].group();
            currentArray = grouping.all().map(function(d){
              tmpKeyObj = JSON.parse(d.key);
              tmpKeyObj['|size|'] = d.value;
              return tmpKeyObj;
            });
            console.log( 'groupDimension(ms): ' + (new Date().getTime() - startTime));
            return currentArray;
        } else {
          console.error('(2)sending all the data without sampling');
          return this.dimensions[refinerKeys[0] || this.findOneDimKey()].top(LIMIT_NUM_OF_ROWS);
        }
      }

      //TBD: max==min problem,  test filter after grouping
      
      //sampling
      var prefix = null;
      if(spks.length <= 1 ) {
        var size =1000; //default value
        if(comboPK ==='') { comboPK = numberKey; }  //size is 1000
        else { size = +spkObject[comboPK] ;} //pk equal the spks[0]

        var max = this.dimensions[comboPK].top(1)[0][comboPK],
            min = this.dimensions[comboPK].bottom(1)[0][comboPK];
        
        if(max == min) {
           return this.dimensions[refinerKeys[0] || this.findOneDimKey()].top(LIMIT_NUM_OF_ROWS);
        }

        var group, groupItem, comboGroupPK = '|'+ comboPK+'|';
        if(!this.dimensions[comboGroupPK] || !_.isEqual(this.prespkobj, spkObject)) {
          this.prespkobj = _.clone(spkObject);
          if(this.dimensions[comboGroupPK]) { 
            this.dimensions[comboGroupPK].dispose(); 
          }
          this.dimensions[comboGroupPK] = self.crossfilter.dimension(function(d) {
            if(hasGroupBy) {
              group = groupby.map(function(column) {
                return d[column];
              });
              return group.join('|') + Math.floor(size* (d[comboPK] - min) /(max-min)); 
            } else {
              return Math.floor(size* (d[comboPK] - min) /(max-min));
            }
          });
        }
        grouping = this.dimensions[comboGroupPK].group();

      } else if(spks.length >= 2 ) { //two~ dimensions samping
        var multiParams = {};
        spks.forEach(function(onePK){
            multiParams[onePK] = {};
            multiParams[onePK].size = +spkObject[onePK];
            multiParams[onePK].max  = self.dimensions[onePK].top(1)[0][onePK];
            multiParams[onePK].min  = self.dimensions[onePK].bottom(1)[0][onePK];
        });

        if(!this.dimensions[comboPK] || !_.isEqual(this.prespkobj, spkObject)) {
          this.prespkobj = _.clone(spkObject);
          if(this.dimensions[comboPK]) { 
            this.dimensions[comboPK].dispose();
          }
          var dimPKsSizeObj, dimGroupbyObj, dimParam;
              groupColumns= spks.filter(function(column){return multiParams[column].max !== multiParams[column].min;});
              
          this.dimensions[comboPK] = self.crossfilter.dimension(function(d) {
           
            dimPKsSizeObj = groupColumns.map(function(onePK){
              dimParam = multiParams[onePK];
              return Math.floor(dimParam.size * (d[onePK] - dimParam.min) / (dimParam.max- dimParam.min));
            });
            if(hasGroupBy) {
              dimGroupbyObj = groupby.map(function(column){
                return d[column];
              });
              return dimGroupbyObj.join('|') + dimPKsSizeObj.join('|');
            } else {
              return '|'+ dimPKsSizeObj.join('|')+'|';
            }
          });
        }
        grouping = this.dimensions[comboPK].group();
      }
      
      console.log( 'groupingDimension(ms): ' + (new Date().getTime() - startTime));

      if(grouping) { //grouping should have value always
        
        grouping.reduce(
          function reduceAdd(p,v) {
            selector.forEach(function(column) {
              p[column] = v[column];//override to goet the first value of its group for 'String' columns 
            });
             p.size += 1;
            return p;
          },
          function reduceRemove(p,v) {
            selector.forEach(function(column) {
              p[column] = v[column];
            });
            p.size -= 1;
            return p;
          },
          function reduceInitial(){
            var p = {size: 0};
            selector.forEach(function(column) {
              p[column] = null;
            });
            return p;
          }
        );

        console.log( 'reduceDimension(ms): ' + (new Date().getTime() - startTime));

        tmpArray = grouping.all().filter(function(d) { return d.value.size > 0; });
        if(tmpArray.length> LIMIT_NUM_OF_ROWS) {
          tmpArray = _.sample(tmpArray, LIMIT_NUM_OF_ROWS);
        }
        var resultItemKey, packageKeyObj; 
        currentArray = tmpArray
        .map(
          function(p) {
            var row = {};
            selector.forEach(function(column) {
               row[column] = p.value[column];   
            });
            
            row['|size|'] = p.value.size; //return size in its group
            
            return row;
          }
        );//map end
        console.log( 'summaryDimension(ms): ' + (new Date().getTime() - startTime));

        grouping.dispose();
        console.log( 'group dispose(ms): ' + (new Date().getTime() - startTime));
        return currentArray;
      } //if(grouping) end
      
    } catch (e) {
      console.log(e);
      return {};
    }

    //should never arrive here
    return currentArray; 
  }; //this.exec function end
  
}

module.exports= Aggregator;