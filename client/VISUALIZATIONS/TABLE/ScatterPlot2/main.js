/**
 * @fileoverview implement for ScatterPlot
 * @author Akira Kuroda & Li Xinxiao
 * @version 5.0
 * @copyright Toshiba Corporation
 */

/** @module ScatterPlot **/

define(["css!./main"], function () {
  /**
   * Constructor
   * @class ScatterPlot
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {ScatterPlot}
   */
  var ScatterPlot = function (io) {
    this.io = io;

    //set default to highligh mode
    if(!this.io.isHighlightMode() && !this.io.isDrilldownMode()) {
      this.io.setHighlightMode();
    }

    this.io.dataManager().setMapperProps({
      xaxis: { label: 'X Axis', type: 'number', map2: '', size: 'width'},
      yaxis: { label: 'Y Axis', type: 'number', map2: '', size: 'height'}
    });
    /// X Axis
    this.io.designManager()
      .setControl("xaxisCaption", {type:"regx", name:"X AXIS Caption", value:""});
    this.io.designManager()
      .setControl("xaxisticktype", {type: "radio", name: " X AXIS Label Format", range:["dec", "hex"],value:"dec"});
    this.io.designManager()
      .setControl("xaxisticknum", {type: "regx", name: " X AXIS Tick Number", value:4});
        this.io.designManager()
      .setControl("xaxisticktype", {type: "radio", name: " X AXIS Tick Type", range:["Dec","%","Float","SI","Round","Hex"], value:"Dec"});
    this.io.designManager()
      .setControl("xaxisdigitnum", {type: "regx", name: " X AXIS Digit Number", value:""});
    /// Y Axis
    this.io.designManager()
      .setControl("yaxisCaption", {type:"regx", name:"Y AXIS Caption", value:""});
    this.io.designManager()
      .setControl("yaxisticknum", {type: "regx", name: " Y AXIS Tick Number", value:4});
    this.io.designManager()
      .setControl("yaxisticktype", {type: "radio", name: " Y AXIS Tick Type", range:["Dec","%","Float","SI","Round","Hex"], value:"Dec"});
    this.io.designManager()
      .setControl("yaxisdigitnum", {type: "regx", name: " Y AXIS Digit Number", value:""});
    this.io.designManager().setControl("yaxisRangeMaxAuto"  , {type:"radio", name:"Y AXIS Max (Auto)",range:["ON", "OFF"], value:"ON"});
    this.io.designManager().setControl("yaxisRangeMaxManual", {type:"regx", name:"Y AXIS Max (Manual)", value:100});
    this.io.designManager().setControl("yaxisRangeMinAuto"  , {type:"radio", name:"Y AXIS Min (Auto)",range:["ON", "OFF"], value:"OFF"});
    this.io.designManager().setControl("yaxisRangeMinManual", {type:"regx", name:"Y AXIS Min (Manual)", value: 0});
  };

  /**
   * update chart according with changed of interface variables
   * @method ScatterPlot
   * @memberOf ScatterPlot
   * @returns {ScatterPlot}
   */
  ScatterPlot.prototype.update = function (changed) {
    var self = this;
    if (changed.hasOwnProperty("COLOR_MANAGER")) {
      self.updateColors();
    } else if (changed.hasOwnProperty("DESIGN_MANAGER")) {
      self.redraw();
    } else if (changed.hasOwnProperty("DATA_MANAGER")) {
      self.redraw();
    }else if(changed.hasOwnProperty("MODE")){
      if(self.io.isHighlightMode()){
        self.brush = undefined;
        self.redraw();
      }
    }else{
      self.redraw();
    }

    return self.svg_dom;
  };

    /**
     * render Scatter Matrix Chart
     * @method render
     * @memberOf ScatterPlot
     */
  ScatterPlot.prototype.render = function (containerWidth, containerHeight) {
    var self = this;
    // initialize
    self.initialize(containerWidth, containerHeight);
    self.setup();
    // create chart header
    self.createChartHeader();
    // create scatter matrix chart
    self.drawScatterPlot();
    return self.root_dom;
  } ;
  ScatterPlot.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    var self = this;
    self.containerWidth  = containerWidth;
    self.containerHeight = containerHeight;
    self.redraw();
  };

  ScatterPlot.prototype.redraw = function() {
    var self = this;
    self.setup();
    self.createChartHeader();
    self.drawScatterPlot();
    return self.root_dom;
  };

  /**
   * initialize
   * @method initialize
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.initialize = function (containerWidth, containerHeight) {
    /** Layout **/
    this.layout ={
      top  : 20,
      yaxis: {width: 80},
      main:  {margin:{right: 50, top: 20 }}
    };
    /*******************************
     ** Chart Customize Parameter **
     *******************************/
    /** AXIS Signature **/
    this.axisConfig ={
      "Dec"   : "",
      "%"     : "%",
      "Float" : "f",
      "SI"    : "s",
      "Round" : "r",
      "Hex"   : "x"
    };

    /** Y AXIS **/
    this.yConfig = {
      scale: "basic",
      range: { max:"auto", min:0},
      caption : {top:-60, left:"auto"}
    };
    /** X AXIS **/
    // X AXIS [width - YAxis_width]
    this.xConfig = {
      label   : {height: 50},
      range   : {max:"auto", min:"auto"},
      caption : {height:30, top:20, left:"auto"},
      scrollbar: {height:25},
      axis    : {height:25}
    };
    this.containerWidth = containerWidth;
    this.containerHeight= containerHeight;

    /** Brush **/
    this.brush =undefined;


    this.svg       = undefined;
    this.xSvg      = undefined;
    this.ySvg      = undefined;
    this.root_dom  = undefined;
    this.container = undefined;
  };
  /**
   * setup
   * @method setup
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.setup = function () {
    var self = this;
    /** Inner Variable **/
    self.axisWidth = self.containerWidth -
      self.layout.yaxis.width -
      self.layout.main.margin.right;

    self.axisHeight   = self.containerHeight -
      self.layout.top -
      self.xConfig.caption.height -
      self.xConfig.label.height -
      self.xConfig.scrollbar.height;

    /** Others **/
    // Y AXIS
    if(self.yConfig.scale == "basic"){
      self.y = d3.scale.linear().range([self.axisHeight,0]);
    }else{
      self.y= d3.scale.log().range([self.axisHeight,0]);
    }
    self.yAxis = d3.svg.axis().scale(self.y).orient("left");
    // X AXIS
    self.x = d3.scale.linear().range[0,self.axisWidth];
    self.xAxis = d3.svg.axis().scale(self.x).orient("bottom");
  };

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.createChartHeader = function () {
    var self = this;
    if(self.root_dom === undefined){
      self.root_dom  = document.createElement("div");
      self.container = d3.select(self.root_dom);
    }
    if(self.container.selectAll("div.scatterplot")){
      self.container.selectAll("div.scatterplot").remove();
    }
    var yaxisDiv, mainDiv, xaxisDiv, xaxisCaptionDiv;
    drawDiv();

    function drawDiv(){
      var div = self.container.append("div")
            .attr("class","scatterplot");
      // Define Div
      yaxisDiv      = div.append("div")
        .attr("class","scatterplot-yaxis")
        .style("width", function(){
          return self.layout.yaxis.width;
        });
      mainDiv       = div.append("div")
        .attr("class","scatterplot-main")
        .style("width", function(){
          return self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right +"px";
        })
        .style("overflow-x","auto");
      xaxisDiv = div.append("div")
        .attr("class","scatterplot-xaxis");
      xaxisCaptionDiv = div.append("div")
        .attr("class","scatterplot-xaxis-caption");
      var mainHeight = self.containerHeight -
            self.layout.top -
            self.xConfig.caption.height -
            self.xConfig.scrollbar.height -
            self.xConfig.axis.height;
      //  SVG [ yAxis, main, xAxis]
      self.ySvg = yaxisDiv.append("svg")
        .attr("class","yaxis")
        .attr("width", self.layout.yaxis.width)
        .attr("height", mainHeight)
        .append("g")
        .attr("transform", "translate(" +
              self.layout.yaxis.width+","+ self.layout.top + ")");
      self.svg = mainDiv.append("svg")
        .attr("class", "scatterplot")
        .style("width", self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right)
        .style("height", mainHeight)
        .append("g")
        .attr("transform", "translate(0," + self.layout.top +")");
      self.xSvg = xaxisDiv.append("svg")
        .attr("class", "xaxis")
        .style("width", self.containerWidth - self.layout.main.margin.right)
        .style("height", self.xConfig.axis.height)
        .append("g")
        .attr("transform", "translate(" + self.layout.yaxis.width + ",0)");
      self.xCaptionSVG =  xaxisCaptionDiv.append("svg")
        .attr("class", "xaxiscaption")
        .attr("width", self.containerWidth)
        .attr("height", self.xConfig.caption.height)
        .append("g")
        .attr("transform","translate(0,"+ self.xConfig.caption.top+")")
        .append("text").attr("class","xaxis")
        .text(self.io.designManager().getValue("xaxisCaption"));
      xaxisCaptionDiv.select("text.xaxis")
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
   * draw scatter matrix chart depend on selected items by user
   * @method drawScatterPlot
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.drawScatterPlot = function () {
    var self = this,
        colorManager = this.io.colorManager(),
        dataManager = this.io.dataManager(),
        data = dataManager.getFilteredRows(),
        xcolumn = dataManager.getMapper('xaxis'),
        ycolumn = dataManager.getMapper('yaxis'),
        filteredRows = dataManager.getFilteredRows();

    if(filteredRows.length <=0 || _.isEmpty(xcolumn) || _.isEmpty(ycolumn))  return;

    var xrange = dataManager.getFilteredDataRange(xcolumn, filteredRows);
    var yrange = dataManager.getFilteredDataRange(ycolumn, filteredRows);
    self.x = d3.scale.linear().range([0,self.axisWidth]).domain(xrange);
    self.y = d3.scale.linear().range([self.axisHeight,0]).domain(yrange);
    // drawX
    self.drawAxis(xcolumn,ycolumn);
    // draw brush
    self.drawBrush();
    // draw dots
    var axisColor    = undefined;
    //var colorManager = this.io.colorManager();
    if(colorManager.getDomainName()){
      if(colorManager.getDomainName().toLowerCase() === "x axis"){
        axisColor = colorManager.getColor(self.io.dataManager().getMapper("xaxis"));
      }else if(colorManager.getDomainName().toLowerCase() === "y axis"){
        axisColor = colorManager.getColor(self.io.dataManager().getMapper("yaxis"));
      }
    }

    this.svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        return self.x(+d[xcolumn]);
      })
      .attr("cy", function (d) {
        return self.y(+d[ycolumn]);
      })
      .attr("r", 3)
      .style("fill", function (d) {
        if(axisColor !== undefined){
          return axisColor;
        }
        return colorManager.getColorOfRow(d);
      });
    //hide unfocused data for highligh mode
    if(this.io.isHighlightMode()) {
      this.svg
        .selectAll("circle")
        .classed("hideme", function (row) {
           return !dataManager.isHighlightRow(row);
        });
    }
  };
  /**
   * For draw axis X, Y
   * @method drawAxis
   * @memberOf ScatterPlot
   * @returns {undefined}
   */
  ScatterPlot.prototype.drawAxis = function (xcolumn, ycolumn) {
    var self = this;
    var filteredRows = self.io.dataManager().getFilteredRows();
    var xrange = self.io.dataManager().getFilteredDataRange(xcolumn, filteredRows);
    var yrange = self.io.dataManager().getFilteredDataRange(ycolumn, filteredRows);
    drawXAxis();
    drawYAxis();

    function drawXAxis(){
      /// 2.Tick
      var format = getFormat("x");
      var xAxis = d3.svg.axis().scale(self.x).orient("bottom")
            .ticks(self.io.designManager().getValue("xaxisticknum"))
            .tickFormat(format);
      /// 3. Draw
      var xAxisG = self.xSvg.append("g")
            .attr("class", "x axis");
      xAxisG.call(xAxis);
    }
    // Y AXIS
    function drawYAxis(){
      /// 2.Tick
      var format = getFormat("y");
      var yAxis = d3.svg.axis().scale(self.y).orient("left")
            .ticks(self.io.designManager().getValue("yaxisticknum"))
            .tickFormat(format);
      /// 3.Draw
      self.ySvg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class"," yaxiscaption")
        .attr("transform", "rotate(-90)")
        .attr("y", self.yConfig.caption.top)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(self.io.designManager().getValue("yaxisCaption"));
      /// 4.Centerize
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
    function getFormat(axisType){
      var sign  = self.axisConfig[self.io.designManager().getValue(axisType+"axisticktype")];
      var digit = self.io.designManager().getValue(axisType+"axisdigitnum");
      var format = sign;
      if(digit !== ""){
        if(sign == "x"){
          format = "#0"+digit+sign;
        }else{
          format = "."+digit+sign;
        }
      }
      return d3.format(format);
    }

  };

  /**
   * draw Brush
   * @method drawBrush
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.drawBrush = function(){
    var self = this;
    if(self.brush === undefined || self.io.isDrilldownMode()){
      self.brush = d3.svg.brush()
        .x(self.x)
        .on("brushstart", function(){
          d3.event.sourceEvent.stopPropagation();
        })
        .on("brushend", function(){
          d3.event.sourceEvent.stopPropagation();
          var filter = {}, xcol = self.io.dataManager().getMapper('xaxis');
          var diff = self.brush.extent()[1] - self.brush.extent()[0];
          if(self.brush.extent() !== undefined && diff > 0){
            filter[xcol] = self.brush.extent();
            self.io.dataManager().setRowRefiner(filter);
          }else{
            filter[xcol] = null;
            self.io.dataManager().setRowRefiner(filter);
          }
        });
      }
      self.svg.append("g")
      .attr("class","x brush")
      .call(self.brush)
      .selectAll("rect")
      .attr("y", -10)
      .attr("height", self.axisHeight + 10 + self.xConfig.label.height);
  };

  ScatterPlot.prototype.updateColors = function() {
    var self = this;
    var colorManager = self.io.colorManager();
    var axisColor    = undefined;
    if(colorManager.getDomainName().toLowerCase() === "x axis"){
      axisColor = colorManager.getColor(self.io.dataManager().getMapper("xaxis"));
    }else if(colorManager.getDomainName().toLowerCase() === "y axis"){
      axisColor = colorManager.getColor(self.io.dataManager().getMapper("yaxis"));
    }


    self.svg.selectAll("circle")
      .style("fill", function (d) {
        if(axisColor !== undefined){
          return axisColor;
        }
        return colorManager.getColorOfRow(d);
      });
  };
  return ScatterPlot;
});
