/**
 * @fileoverview implement for LineChart
 * @author Akira Kuroda
 * @version 1.1
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
    // init interface variables for this chart

    // Outer I/F Values

    // Data Mapper
    this.io.setDataMapper({
      xaxis: {type: 'number', label: 'X axis', map2: ''},
      lines: {type: 'number', label: 'Lines' , map2:[] }
    });
    // Attr
    this.io.setValue("selectedLegends",[]);
    this.io.setValue("interpolation","linear");
    this.io.setValue("xrange",[]);
    this.io.setValue("yrange",[]);
    // DEFAULT
    this.io.setValue("caption","CAPTION");
    this.io.setValue("subCaption","sub-caption");
    this.io.setValue("xaxisCaption","X-AXIS");
    this.io.setValue("yaxisCaption","Y-AXIS");
    this.io.setValue("xaxisticktype","dec");
    this.io.setValue("xaxisticknum",10);
    this.io.setValue("xaxistickformat",".2s");
    this.io.setValue("yaxisticknum",10);
    this.io.setValue("yaxistickformat",".2s");
    // QUERY
    this.io.setValue("filtermode", "OFF");
    this.io.setValue("__query__",{});
  };
  /**
    * update chart according with changed of interface variables
    * @method LineChart
    * @memberOf LineChart
    * @returns {LineChart}
    */
  LineChart.prototype.update = function (changedAttr) {
    var self = this;
    // DATA MAPPING
    if(changedAttr.hasOwnProperty("xaxis.map2") ||
       changedAttr.hasOwnProperty("lines.map2")){
      if(self.io.getValue("xaxis.map2") !== '' &&
         self.io.getValue("lines.map2").length > 0){
        self.selectedLegend = changedAttr["lines.map2"];
        self.allLegend      = changedAttr["lines.map2"].concat();
        self.io.setValue("selectedLegends", changedAttr["lines.map2"]);
        self.xConfig.range.min = "auto";
        self.xConfig.range.max = "auto";
        self.yConfig.range.min = 0;
        self.yConfig.range.max = "auto";
        redraw();
      }
    }
    // LEGEND
    if(changedAttr.hasOwnProperty("selectedLegends")) {
      self.selectedLegend = changedAttr["selectedLegends"].concat();
      self.yConfig.range.min = 0;
      self.yConfig.range.max = "auto";
      redraw();
    }
    // LINE TYPE
    if(changedAttr.hasOwnProperty("interpolation")){
      self.yConfig.interpolation = self.io.getValue("interpolation");
      redraw();
    }
    // AXIS RANGE
    if(changedAttr.hasOwnProperty("xrange")){
      self.xConfig.range.min = self.io.getValue("xrange")[0];
      self.xConfig.range.max = self.io.getValue("xrange")[1];
      redraw();
    }
    if(changedAttr.hasOwnProperty("yrange")){
      self.yConfig.range.min = self.io.getValue("yrange")[0];
      self.yConfig.range.max = self.io.getValue("yrange")[1];
      redraw();
    }
    // LABEL
    if(changedAttr.hasOwnProperty("caption") ||
       changedAttr.hasOwnProperty("subCaption") ||
       changedAttr.hasOwnProperty("xaxisCaption") ||
       changedAttr.hasOwnProperty("yaxisCaption") ||
       changedAttr.hasOwnProperty("yaxisticknum")){
        updateLabel();
    }
    // X AXIS
    if(changedAttr.hasOwnProperty("xaxisticknum") ||
       changedAttr.hasOwnProperty("xaxisticktype")){
      self.xConfig.tick.num = self.io.getValue("xaxisticknum");
      self.xConfig.tick.format = self.io.getValue("xaxisticktype");
      redraw();
    }

    // LINK
    if(changedAttr.hasOwnProperty("__query__")){
      if(self.io.getValue("filtermode") == "ON"){
        self.xConfig.range.min = "auto";
        self.xConfig.range.max = "auto";
        self.yConfig.range.min = 0;
        self.yConfig.range.max = "auto";
        redraw();
      }
    }

    function reset(){
      self.ySvg.remove();
      self.svg.remove();
    }
    function redraw(){
      // convert data
      self.convertData(self.io.data);
      // create chart header
      self.createChartHeader();
      // create line chart
      self.createLineChart();
      return self.root_dom;
    }
    function updateLabel(){
      if(changedAttr.hasOwnProperty("caption")){
        // caption
        self.captionConfig.caption.name = self.io.getValue("caption");
        self.container.select("svg.linechart-caption")
          .select("text#caption").text(function(){
            if(self.captionConfig.caption.name.length > 0){
              return self.captionConfig.caption.name;
            }
            return "  ";
          });
      }else if(changedAttr.hasOwnProperty("subCaption")){
        // subCaption
        self.captionConfig.subCaption.name = self.io.getValue("subCaption");
        self.container.select("svg.linechart-caption")
          .select("text#subCaption").text(function(){
            if(self.captionConfig.caption.name.length > 0){
              return self.captionConfig.subCaption.name;
            }
            return "  ";
          });
      }else if(changedAttr.hasOwnProperty("xaxisCaption")){
        self.xConfig.caption.name = self.io.getValue("xaxisCaption");
        // xAxis Caption
        self.container.select("svg.xaxiscaption")
          .select("text.xaxis")
          .text(self.xConfig.caption.name);
      }else if(changedAttr.hasOwnProperty("yaxisCaption")){
        self.yConfig.caption.name = self.io.getValue("yaxisCaption");
        // yAxis Caption
        self.container.select("svg.yaxis")
          .select("text.yaxiscaption")
          .text(self.yConfig.caption.name);
      }else if(changedAttr.hasOwnProperty("yaxisticknum")){
        self.yConfig.tick.num = self.io.getValue("yaxisticknum");
        var ySvg = self.container.select("g.y.axis");
        var yAxis = d3.svg.axis().scale(self.y).orient("left");
        ySvg.selectAll("g.tick").remove();
        yAxis.ticks(self.yConfig.tick.num);
        if(self.graphType == "normalized"){
          yAxis.tickFormat(d3.format(".0%"));
        }else{
          yAxis.tickFormat(d3.format(self.yConfig.tick.format));
        }
        ySvg.append("g").call(yAxis);
      }
    }

  };

  /**
   * render Line Chart
   * @method render
   * @memberOf LineChart
   */
  LineChart.prototype.render = function (containerWidth, containerHeight) {
    // initialize
    this.initialize(containerWidth, containerHeight);
    if(this.root_dom == undefined){
      this.root_dom   = self.root_dom  = document.createElement("div");
      this.container = d3.select(self.root_dom);
    }
    if(this.io.getValue("xaxis.map2") !== '' &&
       this.io.getValue("lines.map2").length > 0){
      // convert data
      this.convertData(this.io.data);
      // create chart header
      this.createChartHeader();
      // create line chart
      this.createLineChart();
      return this.root_dom;
    }
    return this.root_dom;
  };

  LineChart.prototype.renew = function (options, remove){
    var self = this;
    // convert data
    self.convertData(self.io.data);
    // create chart header
    self.createChartHeader();
    // create line chart
    self.createLineChart();
    return self.root_dom;
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

    /** Y AXIS **/
    // Y AXIS [height - XAxis_height]
    this.yConfig = {
      tick : { num:10, format:".2s"},
      scale: "basic",
      range: { max:"auto", min:0},
      caption : {name:"", top:-60, left:"auto"},
      interpolation : ""
    };
    /** X AXIS **/
    // X AXIS [width - YAxis_width]
    this.xConfig = {
      key: "x",//"__FIRST_COLUMN__",
      tick    : {num:10 , format:".2s"},
      label   : {height: 50},
      range   : {max:"auto", min:"auto"},
      caption : {name: "", height:20, top:20, left:"auto"},
      scrollbar: {height:30}
    };
    /** Caption **/
    this.captionConfig = {
      caption:{name:"",top:25,left:10},
      subCaption:{name:"",top:40},
      height: 45
    };
    /** Tooltip **/
    this.tooltipConfig = {
      caption : "",
      attributes : [],
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
    this.root_dom  = undefined;
    this.container = undefined;
    this.containerWidth = containerWidth;
    this.containerHeight= containerHeight;

    // DATA
    this.data     = [];
    this.allLegend = [];
    this.selectedLegend = [];
    this.legends  = [];

    /** Others **/
    // Line Rectangle
    this.color =  d3.scale.ordinal()
      .range(["#62c462","#f89406","#5bc0de", "#ee5f5b"]);
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

  LineChart.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    this.containerWidth  = containerWidth;
    this.containerHeight = containerHeight;
    this.axisHeight   = containerHeight -
      this.captionConfig.height -
      this.layout.top -
      this.xConfig.caption.height -
      this.xConfig.label.height -
      this.xConfig.scrollbar.height;
    this.axisWidth = containerWidth -
      this.layout.yaxis.width -
      this.layout.main.margin.right;
    // update Range
    this.x = d3.scale.linear().range[0,this.axisWidth];
    this.y = d3.scale.linear().range([this.axisHeight,0]);
    // create chart header
    this.createChartHeader();
    // create line chart
    this.createLineChart();
  };

  /**
   * Convert received data to understandable data format for this chart
   * @method convertData
   * @memberOf LineChart
   */
  LineChart.prototype.convertData = function (data) {
    var self = this;
    self.data = data;
    //.Extract Legend
    extractLegend();
    //.Extract Range
    extractXRange();
    // Set Control
    setControl();
    function extractLegend(){
      self.color.domain(self.io.getValue("lines.map2"));
      self.allLegend = self.io.getValue("lines.map2");

      if(self.selectedLegend.length == 0 ){
        self.selectedLegend = self.allLegend.concat();
        self.io.setValue("selectedLegends", self.selectedLegend);
      }
    }
    function extractXRange(){
      // X Axis Range
      if(self.xConfig.range.max == "auto"){
        self.xConfig.range.max =
          d3.max(self.data, function(d){
            return Number(d[self.io.getValue("xaxis.map2")]);
          });
      }
      if(self.xConfig.range.min == "auto"){
        self.xConfig.range.min =
          d3.min(self.data, function(d){
            return Number(d[self.io.getValue("xaxis.map2")]);
          });
      }
      // XAXIS
      self.io.setControl("xrange", {type:"slider",name:"X AXIS RANGE", range:[self.xConfig.range.min,self.xConfig.range.max]});
      self.io.setValue("xrange", [self.xConfig.range.min, self.xConfig.range.max]);
    }
    function setControl(){
      // LINE TYPE
      self.yConfig.interpolation = self.io.getValue("interpolation");
      // LEGEND
      if( self.io.getValue("selectedLegends").length > 0){
        self.selectedLegend = self.io.getValue("selectedLegends");
      }
      self.io.setControl("selectedLegends", {type:"selection", name:"Legend", range:self.io.getValue("lines.map2"), value:self.selectedLegend});
      // INTERPOLATION
      self.io.setControl("interpolation",
                         {type:"radios", name:"Graph Type",
                          range:["linear", "step","step-before","step-after","basis","bundle","cardinal","monotone"]});
      self.yConfig.interpolation = self.io.getValue("interpolation");
      // LINK
      self.io.setControl("filtermode", {type:"radios", name:"FILTER", range:["ON", "OFF"]});


      if(self.io.getValue("caption") !== undefined){
        self.captionConfig.caption.name = self.io.getValue("caption");
      }
      self.io.setControl("caption", {type:"regx", name:"Caption",
                                     value:self.captionConfig.caption.name});

      if(self.io.getValue("subCaption") !== undefined){
        self.captionConfig.subCaption.name = self.io.getValue("subCaption");
      }
      self.io.setControl("subCaption", {type:"regx", name:"Sub Caption",
                                     value:self.captionConfig.subCaption.name});

      if(self.io.getValue("xaxisCaption") !== undefined){
        self.xConfig.caption.name = self.io.getValue("xaxisCaption");
      }
      self.io.setControl("xaxisCaption", {type:"regx", name:"X AXIS Caption",
                                          value:self.xConfig.caption.name});

      if(self.io.getValue("yaxisCaption") !== undefined){
        self.yConfig.caption.name = self.io.getValue("yaxisCaption");
      }
      self.io.setControl("yaxisCaption", {type:"regx", name:"Y AXIS Caption",
                                          value:self.yConfig.caption.name});

      if(self.io.getValue("yaxisticknum") !== undefined){
        self.yConfig.tick.num = self.io.getValue("yaxisticknum");
      }
      self.io.setControl("yaxisticknum", {type:"regx", name:"Y AXIS TICK NUM",
                                          value:self.yConfig.tick.num});
      self.io.setControl("xaxisticknum", {type:"regx", name:"X AXIS TICK NUM",
                                          value:self.xConfig.tick.num});
      if(self.io.getValue("xaxisticktype") !== undefined){
        self.xConfig.tick.format = self.io.getValue("xaxisticktype");
      }
      self.io.setControl("xaxisticktype", {type:"radios", name:"X AXIS TICK TYPE",
                                           range:["dec","hex"]});
    }
  };

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf LineChart
   */
  LineChart.prototype.createChartHeader = function () {
    var self = this;
    // Initialize
    if(self.container.selectAll("div.linechart")){
      self.container.selectAll("div.linechart").remove();
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
      .attr("class", "linechart")
      .style("width", self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right)
      .style("height", mainHeight)
      .append("g")
      .attr("transform", "translate(0," + self.layout.top +")")
      .on("click", function(){
        var pos = self.x.invert(d3.mouse(this)[0]);
        // DEEPLINK
        var query = {query:[{key:self.io.getValue("xaxis.map2"),value:pos}]};
        self.io.setValue("_DEEPLINK_", {__query__:query});
      });
    function drawDiv(){
      var div = self.container.append("div")
            .attr("class","linechart");
      // Define Div
      captionDiv    = div.append("div").attr("class","linechart-caption");
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
    function drawCaption(){
      var caption = captionDiv.append("svg")
            .attr("class","linechart-caption")
            .attr("width", self.containerWidth)
            .attr("height", self.captionConfig.height);
      caption.append("text").attr("id", "caption")
        .attr("transform", "translate("+ self.captionConfig.caption.left + ","
              + self.captionConfig.caption.top + ")")
        .text(function(){
          if(self.captionConfig.caption !== undefined &&
             self.captionConfig.caption.name !== undefined &&
             self.captionConfig.caption.name.length > 0){
            return self.captionConfig.caption.name;
          }
          return "  ";
      });
      caption.append("text").attr("id", "subCaption")
        .attr("transform", "translate("+ self.captionConfig.caption.left + ","
              + self.captionConfig.subCaption.top + ")")
        .text(function(){
          if(self.captionConfig.subCaption !== undefined &&
             self.captionConfig.subCaption.name !== undefined &&
            self.captionConfig.subCaption.name.length > 0){
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
              self.layout.yaxis.width+","+ self.layout.top + ")");
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
   * create line chart depend on selected items by user
   * @method createLineChart
   * @memberOf LineChart
   */
  LineChart.prototype.createLineChart = function () {
    var self = this;
    // 1.Create Chart Data &  Define Y Range
    var chartData = [];
    createChartData();
    // 2.Draw Axis
    drawAxis();
    // 3.Draw Chart
    drawChart();
    // 4.Draw Tooltips
    drawTooltips();
    // 5.Draw Brush
    drawBrush();

    // inner method
    function createChartData(){
      var labelData ={};
      self.allLegend.forEach(function(key) {
        labelData[key] = self.data.map(function(d) {
          return {x: parseInt(d[self.io.getValue("xaxis.map2")]), value: +d[key]};
        });
      });
      self.allLegend.forEach(function(key){
        if(key !== self.io.getValue("xaxis.map2")){
          var data = labelData[key].filter(function(d){
            return d.value != 0;
          });
        }
      });
      var max = 0;
      var min = Number.MAX_VALUE;
      self.selectedLegend.forEach(function(d){
        var std = {};
        var val = [];
        // create key of object std is label name
        std['name'] = d;
        // create value of object std is value which according to label name in labelData
        if(labelData[d] !== undefined){
          labelData[d].forEach(function(i){
            val.push(i);
          });
        }
        if(self.yConfig.range.max == "auto"){
          var _max = d3.max(val, function(d){return d.value;});
          if(max < _max){ max = _max;}
        }
        if(self.yConfig.range.min == "auto"){
          var _min = d3.min(val, function(d){return d.value;});
          if(min < _min){ min = _min;}
        }
        // set data for values of object std
        std['values'] = val;
        // set data for chartData
        chartData.push(std);
      });

      if(self.yConfig.range.max == "auto"){
        self.yConfig.range.max = max;
      }
      if(self.yConfig.range.min == "auto"){
        self.yConfig.range.min = min;
      }

      // YAXIS
      self.io.setControl("yrange", {type:"slider",name:"Y AXIS RANGE",
                                    range:[self.yConfig.range.min, self.yConfig.range.max]});
      self.io.setValue("yrange", [self.yConfig.range.min, self.yConfig.range.max]);
    }

    /**
     * draw x axis and y axis of chart
     * @method drawAxis
     * @memberOf LineChart
     * @returns {undefined}
     **/
    function drawAxis(){
      // Setup xLabel range
      if(chartData.length > self.xConfig.label.upper){
        self.axisWidth = self.axisWidth/self.xConfig.label.upper * chartData.length;
        self.container.select("svg.linechart").style("width", self.axisWidth +"px");
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
            .ticks(self.xConfig.tick.num);
      if(self.xConfig.tick.format == "dec"){
        xAxis.tickFormat(d3.format(".2s"));
      }else if(self.xConfig.tick.format == "hex"){
        xAxis.tickFormat(d3.format("#04x"));
      }
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
        .attr("class"," yaxiscaption")
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
      // create Line
      var line = d3.svg.line()
            .x(function(d) { return self.x(d.x); })
            .y(function(d) { return self.y(d.value); })
            .interpolate(self.yConfig.interpolation);
      self.svg.append("clipPath")
        .attr("id", "clipLineChart")
        .append("rect")
        .attr("width", self.axisWidth)
        .attr("height", self.axisHeight);
      // create chart
      var labels = self.svg.selectAll(".label")
            .data(chartData)
            .enter()
            .append("g")
            .attr("class", "label")
            .attr('id', function(d, i){
              return d.name;
            });
      labels.append("path")
        .attr("class", "line_chart")
        .style("stroke", function(d) {
          return self.color(d.name);
        })
        .attr("d", function(d) {
          return line(d.values); })
        .style("fill","none");
    }

    function drawTooltips(){
      var line = self.svg.append("line")
            .attr("class","tooltips")
            .attr("x1", 0).attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", function(){
              return self.axisHeight + self.xConfig.label.height;})
            .style("display","none")
            .style("stroke", "orange");
      // ACTION
      self.container.select("div.linechart-main")
        .on("mouseover", function(d){
          line.style("display","block");
        })
        .on("mousemove", function(){
          var xPosition = d3.mouse(this)[0];
          // line
          line.attr("x1", xPosition).attr("x2", xPosition);
          // tooltips
          var xValue   = parseInt(self.x.invert(xPosition));
          // Add X Label
          self.tooltipConfig.attributes
            = [{key: self.io.getValue("xaxis.map2"), value: xValue }];
          var data = createTableData(xValue);
          self.tooltip.show(self.tooltip.table(data, self.tooltipConfig), d3.event);
        })
        .on("mouseout", function(d){
          line.style("display","none");
          self.tooltip.hide();
        });
      function createTableData(xValue){
        var data = []; // key,color,value
        chartData.forEach(function(d){
          var elem = {};
          if(self.selectedLegend.indexOf(d.name) !== -1){
            elem.key = d.name;
            elem.color = self.color(d.name);
            elem.value = "";
            for(var i=0; i< d.values.length; i++){
              if(d.values[i].x == xValue){
                elem.value = d.values[i].value;
                break;
              }else if(d.values[i].x < xValue){
                elem.value = d.values[i].value;
              }else{
                //elem.value = undefined;
                break;
              }
            }
          }
          data.push(elem);
        });
        return data;
      }
    }
    function drawBrush(){
      var brush = d3.svg.brush()
            .x(self.x)
            .on("brushstart", function(){
              d3.event.sourceEvent.stopPropagation();
            })
            .on("brushend", function(){
              d3.event.sourceEvent.stopPropagation();
            });
      self.svg.append("g")
        .attr("class","x brush")
        .call(brush)
        .selectAll("rect")
        .attr("y", -10)
        .attr("height", self.axisHeight + 10 + self.xConfig.label.height);
    }
  };
  return LineChart;
});
