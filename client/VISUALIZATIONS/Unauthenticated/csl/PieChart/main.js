/**
 * @fileoverview implement for PieChart
 * @author Akira Kuroda
 * @version 1.1
 * @copyright Toshiba Corporation
 */

/** @module PieChart*/

/**
 * Initial config additional library files for this chart
 */

/**
 * Create PieChart main function
 * @class PieChart
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {PieChart}
 */
define(["util/CustomTooltip", "css!./style"], function (CustomTooltip) {
  /**
    * Constructor create Pie Chart
    * @method PieChart
    * @memberOf PieChart
    * @returns {PieChart}
    */
  var PieChart = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.setValue({
      selectedLegend : []
    });
  };

  /**
    * update chart according with changed of interface variables
    * @method PieChart
    * @memberOf PieChart
    * @returns {PieChart}
    */
  PieChart.prototype.update = function () {
    var self = this;
    if(changedAttr.hasOwnProperty("selectedLegend")) {
      self.selectedLegend = changedAttr["selectedLegend"].concat();
      self.createPieChart();
    }

    function reset(){
      self.svg.remove();
    }
  };
  /**
   * This function will validate input data for drawing chart. 
   * If data is validate, chart will be drawn.
   * @returns {Boolean}
   */
  PieChart.prototype.validate = function () {
    var isValidate = true;
    return isValidate;
  };
  
  /**
   * render Pie Chart
   * @method render
   * @memberOf PieChart
   */
  PieChart.prototype.render = function (containerElement, containerWidth, containerHeight) {
    // validate data
    var isOk = this.validate();
    if (isOk) {
      // initialize
      this.initialize(containerElement,containerWidth, containerHeight);
      // convert data
      this.convertData(this.io.data);
      // create chart header
      this.createChartHeader(containerElement);
      // create bare chart
      this.createPieChart();
    } else {
      alert('Data error!');
    }
  };
  
  /**
   * initialize
   * @method initialize
   * @memberOf PieChart
   */
  PieChart.prototype.initialize = function (containerElement,containerWidth, containerHeight) {
    /** Layout **/
    this.layout ={
      main:  {margin:{right: 50, left:50, top:20, bottom:20}}
    };
    /*******************************
     ** Chart Customize Parameter **
     *******************************/
    /** Caption **/
    this.captionConfig = {
      caption:{name:"CAPTION",top:25,left:10},
      subCaption:{name:"SUB CAPTION",top:40},
      height: 45
    };
    /** Tooltip **/
    this.tooltipConfig = {
      caption : "",
      attributes: [],
      prefix  : "",
      postfix : ""
    };
    /** SORT **/
    this.sort = "descending"; // descending/ null
    /** Action **/
    this.animation = 500;
    
    /** Inner Variable **/
    // VIEW
    this.tooltip      = new CustomTooltip();
    this.tooltip.initialize();
    
    this.svg       = undefined;
    this.container = undefined;
    this.containerElement = containerElement;
    this.containerWidth = containerWidth;
    this.containerHeight= containerHeight;
    this.width = undefined;
    this.height= undefined; 
    
    // DATA
    this.selectedLegend = [];
    this.allLegend      = [];
    this.chartData      = [];
    /** Others **/
    // Pie Rectangle
    this.color =  d3.scale.ordinal()
      .range(["#62c462","#f89406","#5bc0de", "#ee5f5b"]);
  };


  /**
   * Convert received data to understandable data format for this chart
   ** 1.Extract primarykey
   ** 2.Summarize 
   * @method convertData
   * @memberOf PieChart
   */
  PieChart.prototype.convertData = function (data) {
    var self = this;
    self.data = data;
    // 1.Extract Legend
    extractLegend();
    // 2.Set Width/Height
    self.width = self.containerWidth -
      self.layout.main.margin.left -
      self.layout.main.margin.right;
    self.height = self.containerHeight -
      self.captionConfig.height -
      self.layout.main.margin.top -
      self.layout.main.margin.bottom;
    // 3.Create chartData
    createChartData();
    
    function extractLegend(){
      self.allLegend = d3.keys(self.data[0]);
      self.color.domain(self.allLegend);
      self.allLegend.sort();
      if(self.selectedLegend.length ===  0){
	self.selectedLegend = self.allLegend.concat();
      }
    }
    function createChartData(){
      // convert & normalized
      self.allLegend.forEach(function(key){
	self.chartData.push({key: key , value: self.io.data[0][key]});
      });
    }

  };

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf PieChart
   */
  PieChart.prototype.createChartHeader = function (containerElement) {
    var self = this;
    self.container = d3.select(containerElement);
    // Initialize
    if(self.container.selectAll("div.piechart")){
      self.container.selectAll("div.piechart").remove();
    }
    var captionDiv,mainDiv;
    // Draw Div
    drawDiv();
    // Draw Caption
    drawCaption();

    // Draw SVG
    self.svg = mainDiv.append("svg")
      .attr("class", "piechart")
      .style("width", self.containerWidth)
      .style("height", self.height);
    function drawDiv(){
      var div = self.container.append("div")
	    .attr("class","piechart");
      // Define Div
      captionDiv    = div.append("div").attr("class","caption");
      mainDiv       = div.append("div")
	.attr("class","piechart-main")
	.style("width", 
	       self.containerWidth -
	       self.layout.main.margin.left -
	       self.layout.main.margin.right +"px");
    }
    function drawCaption(){
      var caption = captionDiv.append("svg")
	    .attr("class","caption")
	    .attr("width", self.containerWidth)
	    .attr("height", self.captionConfig.height);
      caption.append("text").attr("id", "caption")
	.attr("transform", "translate("+ self.captionConfig.caption.left + ","
	      + self.captionConfig.caption.top + ")")
	.text(function(){
	  if(self.captionConfig.caption.name.length > 0){
	    return self.captionConfig.caption.name;
	  }
	  return "  ";
      });
      caption.append("text").attr("id", "subCaption")
	.attr("transform", "translate("+ self.captionConfig.caption.left + ","
	      + self.captionConfig.subCaption.top + ")")
	.text(function(){
	  if(self.captionConfig.subCaption.name.length > 0){
	    return self.captionConfig.subCaption.name;
	  }
	return "  ";
	});
    }
  };

  /**
   * create line chart depend on selected items by user
   * @method createPieChart
   * @memberOf PieChart
   */
  PieChart.prototype.createPieChart = function () {
    var self = this;
    // 1.Create Chart Data &  Define Y Range
    var contents;
    // 2.Draw Tooltips
    drawTooltips();
    // 3.Draw Chart
    drawChart();
    
    // inner method
    function drawChart(){
      var radius = Math.min(self.width,self.height)/2;
      var pie;
      if(self.sort == "descending"){
	pie = d3.layout.pie().value(function(d){
	  if(self.selectedLegend.indexOf(d.key) !== -1){
	    return d.value;
	  }
	  return 0;
	});
      }else{
	pie = d3.layout.pie().sort(null).value(function(d){
	  if(self.selectedLegend.indexOf(d.key) !== -1){
	    return d.value;
	  }
	  return 0;
	});
      }
      var arc = d3.svg.arc().innerRadius(0).outerRadius(radius);
      // Draw Slice
      var slice = self.svg.append("g").attr("class","slice")
	    .attr("transform",
		  "translate("+ self.containerWidth/2 + "," +
		  radius +self.layout.main.margin.top +")") ;
      slice.selectAll("path")
	.data(pie(self.chartData))
	.enter()
	.append("path")
	.attr("class", "pie")
      	.style("fill", function(d){ return self.color(d.data.key);})
      	.on("mouseover", function(d){
	  d3.select(this).attr("class","pie focus");
	  self.tooltip.show(contents, d3.event);
	  self.tooltip.changeRowClass(d.data.key, "bold");
	})
      	.on("mouseout", function(){
	  d3.select(this).attr("class","pie");
	  self.tooltip.hide();
	})
	.transition().duration(self.animation)
	.attrTween("d", function(d){
	  var interpolate = d3.interpolate(
	    {startAngle: 0, endAngle: 0},
	    {startAngle: d.startAngle, endAngle:d.endAngle}
	  );
	  return function(t){
	    return arc(interpolate(t));
	  };
	});
    }
  
    function drawTooltips(){
      var elem ={}, data = [];
      var sum = 0;
      self.chartData.forEach(function(d){
	if(self.selectedLegend.indexOf(d.key) !== -1){
	  sum += Number(d.value);
	  data.push({key:d.key, value:Number(d.value), color:self.color(d.key)});
	}
      });
      data.forEach(function(d){
	var value = d.value;
	d.value = value + "  (" + parseInt((value*10000/ sum))/100  + "%)" ;
      });
      contents = self.tooltip.table(data, self.tooltipConfig);
    }
  };
  return PieChart;
});

