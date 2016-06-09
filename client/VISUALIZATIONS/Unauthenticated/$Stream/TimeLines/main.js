//http://square.github.io/cubism/demo/
//http://mikemcdearmon.com/portfolio/techposts/charting-libraries-using-d3
//http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
define(['./cubism.v1'], function(){
  var myclass = function(){};
  
  myclass.prototype.render = function(cWidth, cHeight){
    var context = cubism.context()
      .step(1000)
      .size(cWidth);

    this.root_dom = document.createElement('div');
    
    d3.select(this.root_dom).selectAll(".axis")
        .data(["top", "bottom"])
      .enter().append("div")
        .attr("class", function(d) { return d + " axis"; })
        .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });

    d3.select(this.root_dom).append("div")
        .attr("class", "rule")
        .call(context.rule());

    d3.select(this.root_dom).selectAll(".horizon")
        .data(d3.range(1, 5).map(random))
      .enter().insert("div", ".bottom")
        .attr("class", "horizon")
        .call(context.horizon().extent([-5, 5]).height(Math.floor(cHeight/7)));

    context.on("focus", function(i) {
      d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
    });

    // Replace this with context.graphite and graphite.metric!
    function random(x) {
      var value = 0,
          values = [],
          i = 0,
          last;
      return context.metric(function(start, stop, step, callback) {
        start = +start, stop = +stop;
        if (isNaN(last)) last = start;
        while (last < stop) {
          last += step;
          value = Math.max(-10, Math.min(10, value + .8 * Math.random() - .4 + .2 * Math.cos(i += x * .02)));
          values.push(value);
        }
        callback(null, values = values.slice((start - stop) / step));
      }, x);
    }
    
////////////////
    return this.root_dom;
  };
  myclass.prototype.update = function(){};
  
  return myclass;
  
});
