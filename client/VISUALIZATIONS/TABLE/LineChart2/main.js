/**
 * @fileoverview implement for LineChart
 * @author Akira Kuroda
 * @version 5.0
 * @copyright Toshiba Corporation
 */

/** @module LineChart*/

/**
 * Initial config additional library files for this chart
 */

/**
 * Create LineChart main function
 * @class LineChart
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {LineChart}
 */
define(["util/CustomTooltip",
        "css!./style"], function (CustomTooltip) {
  /**
    * Constructor create Line Chart
    * @method LineChart
    * @memberOf LineChart
    * @returns {LineChart}
    */
  var LineChart = function (io) {
    this.io = io;
    // Data Mapper
    this.io.dataManager().setMapperProps({
      xaxis: {type: 'number', label: 'X axis', map2: ''},
      yaxis: {type: 'number', label: 'Y axis' , map2:[] }
    });

    // Design Mapper
    this.io.designManager()
      .setControl("graphType", {type: "radio", name: " Graph Type",
                                range:["linear", "step","step-before","step-after","basis","bundle","cardinal","monotone"],
                                value:"linear"});
    /// X Axis
    this.io.designManager()
      .setControl("xaxisCaption", {type:"regx", name:"X AXIS Caption", value:""});
    this.io.designManager()
      .setControl("xaxisticknum", {type: "regx", name: " X AXIS Tick Number", value:4});
    this.io.designManager()
      .setControl("xaxisticktype", {type: "radio", name: " X AXIS Tick Type", range:["Dec","%","Float","SI","Round","Hex"], value:"Dec"});
    this.io.designManager()
      .setControl("xaxisdigitnum", {type: "regx", name: " X AXIS Digit Number", value:""});
    /// Y Axis
    this.io.designManager()
      .setControl("yaxisCaption", {type:"regx", name:"Y AXIS Caption", value:"Y AXIS"});
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

    /// Action
    this.io.designManager().setControl("mouseActionMode"  , {type:"radio", name:"Mouse Action Mode",range:["CLICK", "BRUSH"], value:"CLICK"});
  };
  /**
    * update chart according with changed of interface variables
    * @method LineChart
    * @memberOf LineChart
    * @returns {LineChart}
    */
  LineChart.prototype.update = function (changed) {
    var self = this;
    if(changed.hasOwnProperty("COLOR_MANAGER")){
      self.redraw();
    }else if(changed.hasOwnProperty("DESIGN_MANAGER")){
      if(changed.DESIGN_MANAGER.xaxisdigitnum > 10){
        self.io.designManager().setValue("xaxisdigitnum", "");
      }else if(changed.DESIGN_MANAGER.yaxisdigitnum > 10){
        self.io.designManager().setValue("yaxisdigitnum", "");
      }else{
        self.redraw();
      }
    }
    if(changed.hasOwnProperty("DATA_MANAGER")){
      self.redraw();
    }
  };

  /**
   * render Line Chart
   * @method render
   * @memberOf LineChart
   */
  LineChart.prototype.render = function (containerWidth, containerHeight) {
    var self = this;
    self.initialize(containerWidth, containerHeight);
    if(self.io.designManager().getValue("xaxisCaption") == "" ){
      self.io.designManager().setValue("xaxisCaption", self.io.dataManager().getMapper('xaxis'));
    }
    self.createHeader();
    var data = self.transformData(true);
    self.createChart(data);
    return self.root_dom;
  };


  LineChart.prototype.getSelectedLegends = function (refresh) {
    var self = this;
    var selectedLegends = [];
    if(self.io.isHighlightMode() || refresh !== undefined) {
      selectedLegends = self.io.dataManager().getMapper("yaxis");
    }else{
      var selectedColumns = self.io.dataManager().getColumnRefiner();
      var ycols = self.io.dataManager().getMapper("yaxis");
      var pos = 0;
      ycols.forEach(function(col){
        if(selectedColumns.indexOf(col) !== -1){
          selectedLegends.push(col);
        }
      });
    }
    return selectedLegends;
  };

  /**
   * initialize
   * @method initialize
   * @memberOf LineChart
   */
  LineChart.prototype.initialize = function (containerWidth, containerHeight) {
    /** Layout **/
    this.layout ={
      top  : 20,
      yaxis: {width: 80},
      main:  {margin:{right: 50}}
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
      axis    : {height:25},
      margin  : 5
    };

    /** Tooltip **/
    this.tooltipConfig = {
      caption : "",
      attributes : [],
      prefix  : "",
      postfix : "",
      offset  : 0,
      linewidth : 5,
      lineopacity : 0.6
    };
    /** Mode **/
    this._mode = "drilldown"; // ["highlight","drilldown"]

    /** Inner Variable **/
    // VIEW
    this.tooltip      = new CustomTooltip();
    this.tooltip.initialize();
    this.controlPanel = null;

    this.svg          = undefined;
    this.xSvg         = undefined;
    this.ySvg         = undefined;
    this.axisWidth = containerWidth -
      this.layout.yaxis.width -
      this.layout.main.margin.right -
      this.xConfig.margin;

    this.axisHeight   = containerHeight -
      this.layout.top -
      this.xConfig.caption.height -
      this.xConfig.label.height -
      this.xConfig.scrollbar.height;
    this.root_dom  = undefined;
    this.container = undefined;
    this.containerWidth = containerWidth;
    this.containerHeight= containerHeight;

    // DATA
    this.data     = [];
    this.allLegend = [];
    this.legends  = [];

    /** Others **/
    // Y AXIS
    if(this.yConfig.scale == "basic"){
      this.y = d3.scale.linear().range([this.axisHeight,0]);
    }else{
      this.y= d3.scale.log().range([this.axisHeight,0]);
    }
    this.yAxis = d3.svg.axis().scale(this.y).orient("left");
    // X AXIS
    this.x = d3.scale.linear().range[0,this.axisWidth];
    this.xAxis = d3.svg.axis().scale(this.x).orient("bottom");
  };

  LineChart.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    var self = this;
    self.containerWidth  = containerWidth;
    self.containerHeight = containerHeight;
    self.redraw();
  };

 /**
  * create header of chart
  * @method createHeader
  * @memberOf LineChart
  */
  LineChart.prototype.createHeader = function () {
    var self = this;
    if(self.root_dom == undefined){
      self.root_dom   = self.root_dom  = document.createElement("div");
      self.container = d3.select(self.root_dom);
    }
    if(self.container.selectAll("div.linechart")){
      self.container.selectAll("div.linechart").remove();
    }
    var yaxisDiv,mainDiv,xaxiscaptionDiv;
    // Draw Div
    drawDiv();
    // Draw yAxisCaption
    drawXAxisCaptionSVG();
    var mainHeight = self.containerHeight -
          self.layout.top -
          self.xConfig.caption.height -
          self.xConfig.scrollbar.height -
          self.xConfig.axis.height;
    // Draw yAxis
    drawYAxisSVG();
    // Draw SVG
    self.svg = mainDiv.append("svg")
      .attr("class", "linechart")
      .style("width", self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right)
      .style("height", mainHeight)
      .append("g")
      .attr("transform", "translate(0," + self.layout.top +")");
    // Draw xAxis
    drawXAxisSVG();

    function drawDiv(){
      var div = self.container.append("div")
            .attr("class","linechart");
      // Define Div
      yaxisDiv      = div.append("div")
        .attr("class","linechart-yaxis")
        .style("width", function(){
          return self.layout.yaxis.width;
        });
      mainDiv       = div.append("div")
        .attr("class","linechart-main")
        .style("width", function(){
          return self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right +"px";
        })
        .style("overflow-x","auto");
      xaxiscaptionDiv = div.append("div")
        .attr("class","linechart-xaxis-caption");
    }
    function drawYAxisSVG(){
      self.ySvg = yaxisDiv.append("svg")
        .attr("class","yaxis")
        .attr("width", self.layout.yaxis.width)
        .attr("height", mainHeight)
        .append("g")
        .attr("transform", "translate(" +
              self.layout.yaxis.width+","+ self.layout.top + ")");
    }
    function drawXAxisSVG(){
      self.xSvg = mainDiv.append("svg")
        .attr("class", "xaxis")
        .style("width", self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right)
        .style("height", self.xConfig.axis.height)
        .append("g");
    }
    function drawXAxisCaptionSVG(){
      xaxiscaptionDiv.append("svg")
        .attr("class", "xaxiscaption")
        .attr("width", self.containerWidth)
        .attr("height", self.xConfig.caption.height)
        .append("g")
        .attr("transform","translate(0,"+ self.xConfig.caption.top+")")
        .append("text").attr("class","xaxis")
        .text(self.io.designManager().getValue("xaxisCaption"));
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
  * transform Data
  * @method transform Data
  * @memberOf LineChart
  */
  LineChart.prototype.transformData = function (refresh) {
    var self = this;
    var chartData = [];
    var graphType = self.io.designManager().getValue("graphType");

    // 1. Check Data Mapping
    if(self.io.dataManager().getMapperProps("xaxis").map2 == '' ||
       self.io.dataManager().getMapperProps("yaxis").map2 === undefined ||
       self.io.dataManager().getMapperProps("yaxis").map2.length == 0){
      return chartData;
    }
    // 2. Transform Data
    var labelData = {};
    var selectedLegends = self.getSelectedLegends(refresh);
    var data = self.io.dataManager().getFilteredRows();
    if(data.length === 0){
      data = self.io.dataManager().getData();
    }
    selectedLegends.forEach(function(key){
      labelData[key] = data.map(function(d){
        return {x     : +d[self.io.dataManager().getMapperProps("xaxis").map2],
                value : +d[key]};
      });
      // Sort
      labelData[key].sort(function(a,b){
        if(a.x < b.x) return -1;
        if(a.x > b.x) return  1;
        return 0;
      });
    });
    selectedLegends.forEach(function(key){
      var row = {};
      var val = [];
      row["name"] = key;
      labelData[key].forEach(function(v){
        val.push(v);
      });
      row["values"] = val;
      chartData.push(row);
    });
    return chartData;
  };
 /**
  * create chart
  * @method createChart
  * @memberOf LineChart
  */
  LineChart.prototype.createChart = function (data) {
    var self = this;
    if(data.length === 0){
      return;
    };
    // 1. Draw Axis
    self.drawAxis(data);
    // 2. Draw Chart
    self.drawChart(data);
    // 3. Draw Tooltips
    self.drawTooltip(data);
    // 4. Draw Brush
    if(self.io.designManager().getValue("mouseActionMode") == "BRUSH"){
      self.drawBrush();
    }
  };

 /**
  * draw Axis
  * @method drawAxis
  * @memberOf LineChart
  */
  LineChart.prototype.drawAxis = function (data) {
    var self = this;
    self.container.select("svg.linechart").style("width", self.axisWidth +"px");
    // X AXIS
    drawXAxis();
    // Y Axis
    drawYAxis();
    return ;

    function drawXAxis(){
      /// 1.Range
      var xcolumn = self.io.dataManager().getMapper("xaxis");
      var filteredRows = self.io.dataManager().getFilteredRows();
      var xRange;
      if(self._mode === "drilldown"){
        xRange = self.io.dataManager().getFilteredDataRange(xcolumn, filteredRows);
      }else{
        xRange= self.io.dataManager().getDataRange(xcolumn);
      }
      self.x = d3.scale.linear().range([0,self.axisWidth]).domain([xRange[0],xRange[1]]);
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
      /// 1.Range
      var yRange = [];
      if(self.io.designManager().getValue("yaxisRangeMaxAuto") == "OFF" &&
         self.io.designManager().getValue("yaxisRangeMinAuto") == "OFF"){
        yRange.push(self.io.designManager().getValue("yaxisRangeMinManual"));
        yRange.push(self.io.designManager().getValue("yaxisRangeMaxManual"));
      }else{
        data.forEach(function(d){
          if(yRange.length == 0){
            yRange[0] = d3.min(d.values, function(e){ return e.value;});
            yRange[1] = d3.max(d.values, function(e){ return e.value;});
          }else{
            var tmp = [];
            tmp[0] = d3.min(d.values, function(e){ return e.value;});
            tmp[1] = d3.max(d.values, function(e){ return e.value;});
            // min
            if(yRange[0] > tmp[0]){
              yRange[0] = tmp[0];
            }
            // max
            if(yRange[1] < tmp[1]){
              yRange[1] = tmp[1];
            }
          }
        });
        if(self.io.designManager().getValue("yaxisRangeMaxAuto") == "OFF"){
          yRange[1] = +self.io.designManager().getValue("yaxisRangeMaxManual");
        }
        if(self.io.designManager().getValue("yaxisRangeMinAuto") == "OFF"){
          yRange[0] = +self.io.designManager().getValue("yaxisRangeMinManual");
        }
      }
      self.y = d3.scale.linear().range([self.axisHeight,0])
        .domain([yRange[0],yRange[1]]);
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
  * draw Chart
  * @method drawChart
  * @memberOf LineChart
  */
  LineChart.prototype.drawChart = function (data) {
    var self = this;
    var highlights = self.io.dataManager().getMapperProps("yaxis").map2;
    if(self.io.isHighlightMode()){
      highlights = self.io.dataManager().getColumnRefiner();
    }
    var line = d3.svg.line()
          .x(function(d) { return self.x(d.x); })
          .y(function(d) { return self.y(d.value); })
          .interpolate(self.io.designManager().getValue("graphType"));
    self.svg.append("clipPath")
      .attr("id", "clipLineChart")
      .append("rect")
      .attr("width", self.axisWidth)
      .attr("height", self.axisHeight);
    // create chart
    var labels = self.svg.selectAll(".label")
          .data(data)
          .enter()
          .append("g")
          .attr("class", "label")
          .attr('id', function(d){
            return d.name;
          });
    labels.append("path")
      .attr("class", function(d){
        if(highlights.indexOf(d.name) !== -1){
          return "line_chart";
        }
        return "line_chart hideme";
      })
      .style("stroke", function(d) {
        if(self.io.colorManager().getDomainName().toLowerCase() !== "y axis"){
          return self.io.colorManager().getColorOfRow(d.color);
        }
        return self.io.colorManager().getColor(d.name);
      })
      .attr("d", function(d) {
        return line(d.values); })
      .style("fill","none");
  };
  /**
   * drawTooltip
   * @method drawTooltip
   * @memberOf LineChart
   */
  LineChart.prototype.drawTooltip = function (data) {
    var self = this;
    var selectedLegends = self.getSelectedLegends();
    var line = self.svg.append("line")
          .attr("class","tooltips")
          .attr("x1", 0).attr("x2", 0)
          .attr("y1", 0)
          .attr("y2", function(){
            return self.axisHeight + self.xConfig.label.height;})
          .style("display","none")
          .style("stroke", "orange")
          .style("stroke-width", self.tooltipConfig.linewidth)
          .style("stroke-opacity", self.tooltipConfig.lineopacity);
      // ACTION
    self.container.select("div.linechart-main")
      .on("mouseover", function(d){
        line.style("display","block");
      })
      .on("mousemove", function(){
        var xPosition = d3.mouse(this)[0] - self.tooltipConfig.offset;
        // line
        line.attr("x1", xPosition).attr("x2", xPosition);
        // tooltips
	var tooltipKey     = self.io.dataManager().getMapperProps("xaxis").map2;
        var tooltipValue   = parseInt(self.x.invert(xPosition));
        // Add X Label
        /***********************************************************/
	if(self.io.designManager().getValue("xaxisticktype") == "hex"){
	  tooltipValue = "0x" + tooltipValue.toString(16);
	}
        /***********************************************************/
	var data = createTableData(tooltipValue);
        self.tooltipConfig.attributes
          = {key: tooltipKey, value: tooltipValue };
        self.tooltip.show(self.tooltip.table(data, self.tooltipConfig), d3.event);
      })
      .on("mouseout", function(d){
        line.style("display","none");
        self.tooltip.hide();
      })
      .on("click", function(){
        if(self.io.designManager().getValue("mouseActionMode") == "CLICK"){
          var pos = parseInt(self.x.invert(d3.mouse(this)[0]));
          self.io.dataManager()
            .setRowRefiner(self.io.dataManager().getMapperProps("xaxis").map2, pos);
        }
      });
    function createTableData(xValue){
      var tableData = []; // key,color,value
      var highlights = self.io.dataManager().getMapperProps("yaxis").map2;
      if(self.io.isHighlightMode()){
        highlights = self.io.dataManager().getColumnRefiner();
      }
      self.tooltipConfig.caption = self.io.dataManager().getMapperProps("xaxis").map2 + " : " +  xValue;

      data.forEach(function(d){
        var elem = {};
        if(selectedLegends.indexOf(d.name) !== -1){
          elem.key = d.name;
          if(highlights.indexOf(d.name) !== -1){
            if(self.io.colorManager().getDomainName() !== "Y Axis"){
              elem.color = self.io.colorManager().getColorOfRow(d.name);
            }else{
              elem.color = self.io.colorManager().getColor(d.name);
            }
          }
          elem.value = "";
          for(var i=0; i< d.values.length; i++){
            if(d.values[i].x == xValue){
              elem.value = d.values[i].value;
              break;
            }else if(d.values[i].x < xValue){
              elem.value = d.values[i].value;
            }else{
              break;
            }
          }
        }
        tableData.push(elem);
      });
      return tableData;
    }
  };
 /**
  * draw Brush
  * @method drawBrush
  * @memberOf LineChart
  */
 LineChart.prototype.drawBrush = function(){
   var self = this;
   var brush = d3.svg.brush()
         .x(self.x)
         .on("brushstart", function(){
           d3.event.sourceEvent.stopPropagation();
         })
         .on("brushend", function(){
           d3.event.sourceEvent.stopPropagation();
           var filter = {}, xcol = self.io.dataManager().getMapper('xaxis');
           filter[xcol] = brush.empty() ? null : brush.extent();
           self.io.dataManager().setRowRefiner(filter);
         });
   self.svg.append("g")
     .attr("class","x brush")
     .call(brush)
     .selectAll("rect")
     .attr("y", -10)
     .attr("height", self.axisHeight + 10 + self.xConfig.label.height);
 };

  /**
   * redraw
   * @method redraw
   * @memberOf LineChart
   */
  LineChart.prototype.redraw = function () {
    var self = this;
    self.axisHeight   = self.containerHeight -
      self.layout.top -
      self.xConfig.caption.height -
      self.xConfig.label.height -
      self.xConfig.scrollbar.height;
    self.axisWidth = self.containerWidth -
      self.layout.yaxis.width -
      self.layout.main.margin.right -
      self.xConfig.margin;

    self.createHeader();
    var data = self.transformData();
    self.createChart(data);
    return self.root_dom;
  };
 /**
   * mode Selector by user
   * @method mode
   * @memberOf LineChart
   */
   LineChart.prototype.mode = function (mode) {
    if(mode){
      this._mode = mode;
      this.redraw();
    }
    return this._mode;
  };
  return LineChart;
});
