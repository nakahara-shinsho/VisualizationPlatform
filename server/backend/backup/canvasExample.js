function MyChart () {
  
  //public member for asyn call
  this.syn = function(options) {
    var vt = {data:{}};
    return vt;
  };
}
module.exports = new MyChart();