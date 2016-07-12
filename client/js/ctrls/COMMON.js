define(function(){
  var MyClass = function(){};
  
    //create an new hash/array from event String
  MyClass.prototype.makeObject = function(param, initValue ) {
      var ret = initValue;
      if(param) {
        if( param.constructor == String) {
          ret = JSON.parse(param);
        } else {
          ret = _.clone(param);
        } 
      }
      return ret;
  };
  
 //compare two arrray have the same elements without considering their orders
 //@param: @arr1, @arr2
 MyClass.prototype.isEqualArray = function(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr2.indexOf(arr1[i]) < 0 ) {
            return false;
        }
    }
    return true;
 };
 
  //compare two object have the same elements without considering their orders
 //@param: @arr1, @arr2
 MyClass.prototype.isEqualObject= function(obj1, obj2) {
    var ret = false;
    if(obj1.constructor == String && obj2.constructor== String ) {
        ret= (obj1 == obj2);
    } else 
    if(obj1.constructor == Array && obj2.constructor== Array ) { //order in unrelated
       ret = (_.difference(obj1, obj2).length <=0 && _.difference(obj2, obj1).length <=0) ; 
    } else 
    if(obj1.constructor == Object && obj2.constructor== Object ) {
       ret= (JSON.stringify(obj1) == JSON.stringify(obj2) ); //order is important!
    }
    return ret;
 };
 
 MyClass.prototype.numberAfterDot= function (val) {
      var number = 0, sval = val.toString();
      if(sval.split('.').length >1) {
          number = sval.split('.')[1].length;
      }
      return number;
 };
 
 return new MyClass();
 
});
