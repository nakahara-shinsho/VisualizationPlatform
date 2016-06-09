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
      .setControl("xaxisticktype", {type: "radio", name: " X AXIS Label Format", range:["dec", "hex"],value:"dec"});
    this.io.designManager()
      .setControl("xaxisticknum", {type: "regx", name: " X AXIS Tick Number", value:4});
    /// Y Axis
      this.io.designManager()
      .setControl("yaxisticknum", {type: "regx", name: " Y AXIS Tick Number", value:4});
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
      this.updateColors();
    }
    else if (changed.hasOwnProperty("DESIGN_MANAGER")) {
      this.redraw();
    }
    else if (changed.hasOwnProperty("DATA_MANAGER")) {
      this.redraw();
    } else {
      this.redraw();
    }
    return this.svg_dom;
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
      main:  {margin:{right: 50}}
    };
    /*******************************
     ** Chart Customize Parameter **
     *******************************/

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
      caption : {height:20, top:20, left:"auto"},
      scrollbar: {height:25},
      axis    : {height:25}
    };
    this.containerWidth = containerWidth;
    this.containerHeight= containerHeight;

    /** Mode **/
    this._mode = "highlight"; // ["highlight","drilldown"]

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
    self.yAxis = d3.svg.axis().scale(self.y).orient("left")
    //.ticks(self.io.designManager().getValue("yaxisticknum"))
      .tickFormat(d3.format(".2s"));
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
    // Brush
    self.brush = null;

    if(self.root_dom === undefined){
      self.root_dom  = document.createElement("div");
      self.container = d3.select(self.root_dom);
    }
    if(self.container.selectAll("div.scatterplot")){
      self.container.selectAll("div.scatterplot").remove();
    }
    var yaxisDiv, mainDiv, xaxisDiv;
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

    /*
    if(self.io.designManager().getValue("yaxisRangeMinAuto") == "OFF"){
      yrange[0] = Number(self.io.designManager().getValue("yaxisRangeMinManual"));
    }
    if(self.io.designManager().getValue("yaxisRangeMaxAuto") == "OFF"){
      yrange[1] = Number(self.io.designManager().getValue("yaxisRangeMaxManual"));
    }
    self.x.range([0,  self.width]).domain(xrange);
    self.y.range([self.height, 0]).domain(yrange);
    self.xAxis = d3.svg.axis().scale(self.x).orient("bottom").ticks(5);
    self.yAxis = d3.svg.axis().scale(self.y).orient("left").ticks(5);
     */
    self.x = d3.scale.linear().range([0,self.axisWidth]).domain(xrange);
    self.y = d3.scale.linear().range([self.axisHeight,0]).domain(yrange);
    // drawX
    self.drawAxis(xcolumn,ycolumn);
    //define brush
    self.brush =d3.svg.brush()
      .x(self.x)
      .y(self.y)
      .on("brushstart", function () {
        self.brushstart(self, this, xcolumn, ycolumn);
      })
      .on("brush", function () {
        self.brushmove(self, xcolumn, ycolumn);
      })
      .on("brushend", function () {
        self.brushend(self, xcolumn, ycolumn);
      });

    //draw frame to brush
    var brushframe = self.svg.append("rect")
          .attr("class", 'frame')
          .attr("x", 0)
          .attr("y", 0)
          .style("width", self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right)
          .style("height",self.containerHeight -  self.layout.top -
            self.xConfig.caption.height -
            self.xConfig.scrollbar.height -
            self.xConfig.axis.height)
          .call(self.brush).on("mousedown", function () {
            //d3.event.stopPropagation();
          });

    // draw dots
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
      var xAxis = d3.svg.axis().scale(self.x).orient("bottom").ticks(5);
      //.ticks(self.io.designManager().getValue("xaxisticknum"));
      /*
      if(self.io.designManager().getValue("xaxisticktype") == "dec"){
        xAxis.tickFormat(d3.format(".2s"));
      }else if(self.io.designManager().getValue("xaxisticktype") == "hex"){
        xAxis.tickFormat(d3.format("#04x"));
      }
       */
      /// 3. Draw
      var xAxisG = self.xSvg.append("g")
            .attr("class", "x axis");
      xAxisG.call(xAxis);
    }
    // Y AXIS
    function drawYAxis(){
      /// 2.Tick
      var yAxis = d3.svg.axis().scale(self.y).orient("left")
            //.ticks(self.io.designManager().getValue("yaxisticknum"))
            .ticks(5)
            .tickFormat(d3.format(".2s"));
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
  };

  /**
   * Clear the previously-active brush, if any.
   * @method brushstart
   * @param {type} p
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.brushstart = function (chart, frame, xcolumn, ycolumn) {  
    d3.select(frame).call(chart.brush.clear());
    d3.event.sourceEvent.stopPropagation();
   };

  /**
   * Highlight the selected circles.
   * @method brushmove
   * @param {type} p
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.brushmove = function (chart, xcolumn, ycolumn) {
    var e = chart.brush.extent();
    chart.svg.selectAll("circle").classed("hideme", function (d) {
        return e[0][0] > +d[xcolumn] || +d[xcolumn] > e[1][0] || e[0][1] > +d[ycolumn] || +d[ycolumn] > e[1][1];
    });
  };

  /**
   * If the brush is empty(no selection), show (restore) all circles.
   * @method brushend
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.brushend = function (chart, xcolumn, ycolumn) {
    var filterset = {},
        mappedColumns = chart.io.dataManager().getMappedColumns();
    d3.event.sourceEvent.stopPropagation();
    mappedColumns.forEach(function(column) {
      if(!_.has(filterset, column)){
        filterset[column] = null;
      }
    });
    if (chart.brush.empty()) {
       chart.io.dataManager().setRowRefiner(filterset); //clear refiner of all visible columns
    }
    else {
        var e = chart.brush.extent(),
            selector = chart.io.dataManager().getColumnRefiner();
        if(xcolumn == ycolumn) {
            filterset[xcolumn]= [Math.max(e[0][0], e[0][1]), Math.min(e[1][0], e[1][1])];
        } else {
            filterset[xcolumn]= [e[0][0], e[1][0]];
            filterset[ycolumn]= [e[0][1], e[1][1]];
        }
        chart.io.dataManager().setRowRefiner(filterset);
    }
  };

  ScatterPlot.prototype.updateColors = function() {
     var colorManager = this.io.colorManager();
     this.svg.selectAll("circle")
      .style("fill", function (d) {
        return colorManager.getColorOfRow(d);
      });
  };
  
  return ScatterPlot;
});
