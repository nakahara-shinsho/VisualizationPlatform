/**
 * @fileoverview implement for ScatterplotChart
 * @author Akira Kuroda
 * @version 1.1
 * @copyright Toshiba Corporation
 */

/** @module ScatterplotChart*/

/**
 * Initial config additional library files for this chart
 */

/**
 * Create ScatterplotChart main function
 * @class ScatterplotChart
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {ScatterplotChart}
 */
define(["util/CustomTooltip", "css!./style"], function (CustomTooltip) {
  /**
    * Constructor create Scatterplot Chart
    * @method ScatterplotChart
    * @memberOf ScatterplotChart
    * @returns {ScatterplotChart}
    */
  var ScatterplotChart = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.setValue({
      selectedLegend : []
    });
  };
  
  /**
    * update chart according with changed of interface variables
    * @method ScatterplotChart
    * @memberOf ScatterplotChart
    * @returns {ScatterplotChart}
    */
  ScatterplotChart.prototype.update = function () {
    var self = this;
    if(changedAttr.hasOwnProperty("selectedLegend")) {
      self.selectedLegend = changedAttr["selectedLegend"].concat();
      reset();
      // create chart header
      self.createChartHeader(self.containerElement);
      self.createScatterplotChart();
    }

    function reset(){
      self.ySvg.remove();
      self.svg.remove();
    }
  };
  
  
  /**
   * This function will validate input data for drawing chart. 
   * If data is validate, chart will be drawn.
   * @returns {Boolean}
   */
  ScatterplotChart.prototype.validate = function () {
    var isValidate = true;
    return isValidate;
  };
  
  /**
   * render Scatterlplot Chart
   * @method render
   * @memberOf ScatterplotChart
   */
  ScatterplotChart.prototype.render = function (containerElement, containerWidth, containerHeight) {
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
      this.createScatterplotChart();
    } else {
      alert('Data error!');
    }
  };
  
  /**
   * initialize
   * @method initialize
   * @memberOf ScatterplotChart
   */
  ScatterplotChart.prototype.initialize = function (containerElement,containerWidth, containerHeight) {
    /** Layout **/
    this.layout ={
      top  : 20,
      yaxis: {width: 80},
      main:  {margin:{right: 50}}
    };
    /*******************************
     ** Chart Customize Parameter **
     *******************************/

    /** Y AXIS **/
    // Y AXIS [height - XAxis_height]
    this.yConfig = {
      key  : ["B","C"],
      tick : { num:10, format:".2s"},
      scale: "basic",
      range: { max:"auto", min:0},
      caption : {name:"Y AXIS LABEL", top:-60, left:"auto"},
      interpolation : "linear"
    };
    /** X AXIS **/
    // X AXIS [width - YAxis_width]
    this.xConfig = {
      key: "A",//"__FIRST_COLUMN__",
      tick    : {num:10 , format:".2s"},
      label   : {height: 50},
      range   : {max:"auto", min:0},
      caption : {name: "X AXIS LABEL", height:20, top:20, left:"auto"},
      scrollbar: {height:30}
    };
    /** LEGEND **/
    this.legendConfig = {
      targetColumn : ["D","E"], 
      legends : []
    };
    /** COLOR **/
    this.color =  ["#62c462","#f89406","#5bc0de", "#ee5f5b"];
    /** Caption **/
    this.captionConfig = {
      caption:{name:"CAPTION",top:25,left:10},
      subCaption:{name:"SUB CAPTION",top:40},
      height: 45
    };
    /** Tooltip **/
    this.tooltipConfig = {
      caption : "",
      prefix  : "",
      postfix : ""
    };
    /** Action **/
    //this.xAxisLabelClick TYPE =[updateAttribute,screenLink]
    
    /** Inner Variable **/
    // VIEW
    this.tooltip      = new CustomTooltip();
    this.tooltip.initialize();
    this.controlPanel = null;

    this.svg          = undefined;
    this.ySvg         = undefined;
    this.axisWidth = containerWidth -
      this.layout.yaxis.width -
      this.layout.main.margin.right;

    this.axisHeight   = containerHeight -
      this.captionConfig.height -
      this.layout.top -
      this.xConfig.caption.height -
      this.xConfig.label.height -
      this.xConfig.scrollbar.height;
    this.container = undefined;
    this.containerElement = containerElement;
    this.containerWidth = containerWidth;
    this.containerHeight= containerHeight;
    
    // DATA
    this.data     = [];
    this.selectedLegend = [];
    
    /** Others **/
    this.color =  d3.scale.ordinal()
      .range(this.color);
    // Y AXIS
    if(this.yConfig.scale == "basic"){
      this.y     = d3.scale.linear().range([this.axisHeight,0]);
    }else{
      this.y     = d3.scale.log().range([this.axisHeight,0]);
    }
    this.yAxis = d3.svg.axis().scale(this.y).orient("left")
      .ticks(this.yConfig.tick.num).tickFormat(d3.format(this.yConfig.tick.format));
    // X AXIS
    this.x = d3.scale.linear().range[0,this.axisWidth];
    this.xAxis = d3.svg.axis().scale(this.x).orient("bottom");
  };


  /**
   * Convert received data to understandable data format for this chart
   ** 1.Extract primarykey
   ** 2.Summarize 
   * @method convertData
   * @memberOf ScatterplotChart
   */
  ScatterplotChart.prototype.convertData = function (data) {
    var self = this;
    self.data = data;
    // 1.Set PrimaryKey
    if(self.xConfig.key === "__FIRST_COLUMN__"){
      for(var key in self.data[0]){
	self.xConfig.key = key;
	break;
      }
    }
    // 2.Extract Legend
    extractLegend();
    function extractLegend(){
      if(self.legendConfig.targetColumn.length > 0){
	var target,elem;
	self.data.forEach(function(d){
	  elem = [];
	  self.legendConfig.targetColumn.forEach(function(col){
	    elem.push(col +"="+d[col]);
	  });
	  target = elem.join(" && ");
	  if(self.legendConfig.legends.indexOf(target) === -1){
	    if(self.yConfig.key.length > 1){
	      self.yConfig.key.forEach(function(yKey){
		self.legendConfig.legends.push(yKey +" && "+target);
	      });
	    }else{
	      self.legendConfig.legends.push(target);
	    }
	  }
	});
      }else {
	if(self.yConfig.key.length > 1){
	  self.legendConfig.legends =  self.yConfig.key.concat();
	}else{
	  self.legendConfig.legends.push("__NO_LEGEND__");
	}
      }
      self.legendConfig.legends.sort();
      self.color.domain(self.legendConfig.legends);
      if(self.selectedLegend.length == 0){
	self.selectedLegend = self.legendConfig.legends.concat();
      }
    }
  };
    
  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf ScatterplotChart
   */
  ScatterplotChart.prototype.createChartHeader = function (containerElement) {
    var self = this;
    self.container = d3.select(containerElement);
    // Initialize
    if(self.container.selectAll("div.scatterplotchart")){
      self.container.selectAll("div.scatterplotchart").remove();
    }
    var captionDiv,yaxisDiv,mainDiv,xaxiscaptionDiv;
    // Draw Div
    drawDiv();
    // Draw Caption
    drawCaption();
    // Draw yAxisCaption
    drawXAxisCaptionSVG();
    var mainHeight = self.containerHeight -
	  self.layout.top -
	  self.xConfig.caption.height -
	  self.captionConfig.height -
	  self.xConfig.scrollbar.height;
    // Draw yAxis
    drawYAxisSVG();
    // Draw SVG
    self.svg = mainDiv.append("svg")
      .attr("class", "scatterplotchart")
      .style("width", self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right)
      .style("height", mainHeight)
      .append("g")
      .attr("transform", "translate(0," + self.layout.top +")");
    
    function drawDiv(){
      var div = self.container.append("div")
	    .attr("class","scatterplotchart");
      // Define Div
      captionDiv    = div.append("div").attr("class","caption");
      yaxisDiv      = div.append("div")
	.attr("class","scatterplotchart-yaxis")
	.style("width", function(){
	  return self.layout.yaxis.width;
	});
      mainDiv       = div.append("div")
	.attr("class","scatterplotchart-main")
	.style("width", function(){
	  return self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right +"px";
	})
	.style("overflow-x","auto");
      xaxiscaptionDiv = div.append("div")
	.attr("class","scatterplotchart-xaxis-caption");
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
    function drawYAxisSVG(){
      self.ySvg = yaxisDiv.append("svg")
      	.attr("class","yaxis")
	.attr("width", self.layout.yaxis.width)
	.attr("height", mainHeight)
	.append("g")
	.attr("transform", "translate(" +
	      yaxisDiv.property("clientWidth")+","+ self.layout.top + ")");
    }
    function drawXAxisCaptionSVG(){
      xaxiscaptionDiv.append("svg")
	.attr("class", "xaxiscaption")
	.attr("width", self.containerWidth)
	.attr("height", self.xConfig.caption.height)
	.append("g")
	.attr("transform","translate(0,"+ self.xConfig.caption.top+")")
	.append("text").attr("class","xaxis")
	.text(self.xConfig.caption.name);
      
      xaxiscaptionDiv.select("text.xaxis")
	.attr("x", function(){
	  if(self.xConfig.caption.left === "auto" ||
	     self.xConfig.caption.left == undefined){
	    return self.containerWidth/2  -
	      d3.select(this).property("clientWidth")/2;
	  }
	  return  self.xConfig.caption.left;
	});
    }
  };

  /**
   * create scatterplot chart depend on selected items by user
   * @method createScatterplotChart
   * @memberOf ScatterplotChart
   */
  ScatterplotChart.prototype.createScatterplotChart = function () {
    var self = this;
    // 1.Create Chart Data &  Define Y Range
    var chartData = [];
    createChartData();
    // 2.Extract Range
    extractRange();
    // 3.Draw Axis
    drawAxis();
    // 4.Draw Chart
    drawChart();
    // 5.Draw Brush
    drawBrush();
    
    // inner method
    function createChartData(){
      var legend;
      var legend_;
      self.data.forEach(function(d){
	legend = [];
	if(self.legendConfig.legend === "__NO_LEGEND__"){
	  legend.push("__NO_LEGEND__");
	}else{
	  self.legendConfig.targetColumn.forEach(function(e){
	    legend.push(e+"="+d[e]);
	  });
	}
	self.yConfig.key.forEach(function(yKey){
	  legend_ = legend.join(" && ");
	  if(self.yConfig.key.length > 1){
	    legend_ = yKey + " && " + legend_;
	  }
	  var obj = {
	    x     : Number(d[self.xConfig.key]),
	    y     : Number(d[yKey]),
	    legend: legend_
	  };
	  chartData.push(obj);
	});
      });
    }
    function extractRange(){
      if(self.xConfig.range.max == "auto"){
	self.xConfig.range.max =
	  d3.max(chartData, function(d){return d.x;});
      }
      if(self.xConfig.range.min == "auto"){
	self.xConfig.range.min =
	  d3.min(chartData, function(d){return d.x;});
      }
      if(self.yConfig.range.max == "auto"){
	self.yConfig.range.max =
	  d3.max(chartData, function(d){return d.y;});
      }
      if(self.yConfig.range.min == "auto"){
	self.yConfig.range.min =
	  d3.min(chartData, function(d){return d.y;});
      }
    }

    /**
     * draw x axis and y axis of chart
     * @method drawAxis
     * @memberOf ScatterplotChart
     * @returns {undefined}
     **/
    function drawAxis(){
      // Setup xLabel range
      if(chartData.length > self.xConfig.label.upper){
	self.axisWidth = self.axisWidth/self.xConfig.label.upper * chartData.length;
	self.container.select("svg.scatterplotchart").style("width", self.axisWidth +"px");
      }
      
      self.x = d3.scale.linear().range([0,self.axisWidth])
	.domain([self.xConfig.range.min, self.xConfig.range.max]);
      if(self.yConfig.scale == "basic"){
	self.y = d3.scale.linear().range([self.axisHeight,0])
	  .domain([self.yConfig.range.min, self.yConfig.range.max]);
      }else if(self.yConfig.scale == "log"){
	self.y = d3.scale.log().range([self.axisHeight,0])
	  .domain([self.yConfig.range.min, self.yConfig.range.max]);
      }
      // Initialize X Axis
      var xAxis = d3.svg.axis().scale(self.x).orient("bottom")
	    .ticks(self.xConfig.tick.num)
	    .tickFormat(d3.format(self.xConfig.tick.format));
      // Initialize Y Axis
      var yAxis = d3.svg.axis().scale(self.y)
	    .orient("left");
      yAxis.ticks(self.yConfig.tick.num)
	.tickFormat(d3.format(self.yConfig.tick.format));
      // Create X Axis
      self.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", 'translate(0,'+ self.axisHeight+')')
        .call(xAxis);
      // Create Y Axis
      self.ySvg.append("g")
        .attr("class", "y axis")
	.call(yAxis)
        .append("text")
	.attr("class"," caption")
        .attr("transform", "rotate(-90)")
        .attr("y", self.yConfig.caption.top)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(self.yConfig.caption.name);
      /// Centerize
      self.ySvg.select("text.caption")
	.attr("x", function(){
	  if(self.yConfig.caption.left === "auto" ||
	     self.yConfig.caption.left === undefined){
	    var left = (self.axisHeight - self.xConfig.label.height)/2 -
	   self.ySvg.select("text").property("clientWidth")/2;
	    return  -left;
	  }
	  return self.yConfig.caption.left;
	});
    }

    function drawChart(){
      // Create Group
      self.legendConfig.legends.forEach(function(id){
	self.svg.append("g")
	  .attr("class",
		id.replace(/\s/g,"").replace(/&&/g,"_AND_").replace(/=/g,"_EQ_"))
	  .style("display", function(){
	    if(self.selectedLegend.indexOf(id) !== -1){
	      return "block";
	    }
	    return "none";
	  });
      });
      chartData.forEach(function(d){
	self.svg
	  .select("g." + (d.legend.replace(/\s/g,"").replace(/&&/g,"_AND_").replace(/=/g,"_EQ_")))
	  .append("circle")
	  .attr("cx", self.x(d.x))
	  .attr("cy", self.y(d.y))
	  .attr("r", 2)
	  .style("fill", self.color(d.legend));
      });
    }

    function drawBrush(){
      var brush = d3.svg.brush()
	    .x(self.x)
	    .y(self.y)
	    .on("brush", function(){
	      d3.event.sourceEvent.stopPropagation();
	    })
	    .on("brushstart", function(){
	      d3.event.sourceEvent.stopPropagation();
	    })
      	    .on("brushend", function(){
	      d3.event.sourceEvent.stopPropagation();
	    });
      self.svg.append("g")
	.attr("class","brush")
	.call(brush);
    }
  };
  return ScatterplotChart;
});
