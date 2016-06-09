define(['./dimple.v2.1.6'/*, "css!./barchart"*/], function(dimple){
 function MyClass(io){
  this.io = io;
 }
 
 MyClass.prototype.render=function( width, height){
  
  var svg = dimple.newSvg(null, width, height);
  
  var myChart = new dimple.chart(svg, this.io.data);
  
  var x = myChart.addCategoryAxis("x", "Month");
  x.addOrderRule("Date");
  myChart.addMeasureAxis("y", "Unit Sales");
  myChart.addSeries(null, dimple.plot.bar);
  myChart.draw();
  
  var svg_dom = svg[0][0];
  
  svg_dom.className = 'barchart';
  return svg_dom;
};
 
MyClass.prototype.update=function(){
};
 
 return MyClass;

});
