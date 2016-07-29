
/**
 * @fileoverview implement for GanttChart
 * @author Akira Kuroda 
 * @version 5.0
 * @copyright Toshiba Corporation
 */

/** @module GanttChart **/

define(["util/CustomTooltip",
        "css!./style"], function (CustomTooltip) {
  /**
   * Constructor
   * @class GanttChart
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {GanttChart}
   */
  var GanttChart = function (io) {
    this.io = io;

    //set default to highligh mode
    if(!this.io.isHighlightMode() && !this.io.isDrilldownMode()) {
      this.io.setHighlightMode();
    }
    this.io.dataManager().setMapperProps({
      time   : { label: 'TIME', type: 'number', map2: '', spk: 'width'},
      label  : { label: 'LABEL', type: 'string', map2: ''},
      status : { label: 'STATUS', type: 'number', map2: ''}
    });

    // Design Manager
    this.io.designManager()
      .setControl("Height", {type:"regx", name: "Line Height", value:10});
    this.io.designManager()
      .setControl("HIGH_LOW", {type:"radio", name: "HIGH & LOW", range:["HIGH/LOW", "LOW/HIGH"],value:"LOW/HIGH"});
    this.io.designManager()
      .setControl("MoveRange", {type:"regx", name: "Move Range (%)", value:10});

    /*
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
 */
  };
  /**
   * update chart according with changed of interface variables
   * @method GanttChart
   * @memberOf GanttChart
   * @returns {GanttChart}
   */
  GanttChart.prototype.update = function (changed) {
    var self = this;
    if (changed.hasOwnProperty("DESIGN_MANAGER")) {
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
     * render GanttChart
     * @method render
     * @memberOf GanttChart
     */
  GanttChart.prototype.render = function (containerWidth, containerHeight) {
    var self = this;
    // initialize
    self.initialize(containerWidth, containerHeight);
    self.setup();
    // create chart header
    self.createChartHeader();
    // create scatter matrix chart
    self.drawGanttChart();
    return self.root_dom;
  };
  GanttChart.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    var self = this;
    self.containerWidth  = containerWidth;
    self.containerHeight = containerHeight;
    self.redraw();
  };

  GanttChart.prototype.redraw = function() {
    var self = this;
    self.setup();
    self.labelTable.selectAll("svg#time").remove();
    self.labelTable.selectAll("svg").selectAll("path").remove();
    self.drawGanttChart();
    return self.root_dom;
  };

  /**
   * initialize
   * @method initialize
   * @memberOf GanttChart
   */
  GanttChart.prototype.initialize = function (containerWidth, containerHeight) {
    /** Layout **/
    this.layout ={
      top  : 20,
      label: {width: 175},
      main : {margin:{right: 100, top: 20 }}
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
    this.labelConfig = {
      height: 50
    };
    this.limitLower = 0;
    this.limitUpper = 500;
    this.limitDiff  = 500;
    this.currentDrawIndex = 250;
    /** X AXIS **/
    // X AXIS [width - YAxis_width]
    this.xConfig = {
      label   : {height: 50, width: 0},
      range   : {max:"auto", min:"auto"},
      caption : {height:30, top:20, left:"auto"},
      scrollbar: {height:25},
      axis    : {height:25}
    };
    this.containerWidth = containerWidth;
    this.containerHeight= containerHeight;

    /** Brush **/
    this.brush =undefined;


    this.mainSVG    = undefined;
    this.timeSVG    = undefined;
    this.labelTable = undefined;
    this.root_dom   = undefined;
    this.container  = undefined;
  };
  /**
   * setup
   * @method setup
   * @memberOf GanttChart
   */
  GanttChart.prototype.setup = function () {
    var self = this;
    /** Inner Variable **/
    self.tooltip      = new CustomTooltip();
    self.tooltip.initialize();
    self.axisWidth = self.containerWidth -
      self.layout.label.width;
    self.domainWidth =
      self.containerWidth -
      self.layout.label.width -
      self.layout.main.margin.right;

    self.axisHeight   = self.containerHeight -
      self.layout.top -
      self.xConfig.caption.height -
      self.xConfig.label.height -
      self.xConfig.scrollbar.height;

    /** Others **/
    // X AXIS
    self.x = d3.scale.linear().range[0,self.domainWidth];
    self.xAxis = d3.svg.axis().scale(self.x).orient("bottom");
  };

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf GanttChart
   */
  GanttChart.prototype.createChartHeader = function () {
    var self = this;
    // RESET
    if(self.root_dom === undefined){
      self.root_dom  = document.createElement("div");
      self.container = d3.select(self.root_dom);
    }
    var ctrlDiv, timeDiv, labelDiv, mainDiv, labelCaptionDiv, mainCaptionDiv;
    drawDiv();
    drawControl();
    drawLabelTable();

    function drawDiv(){
      if(self.container.selectAll("div.gantt")){
        self.container.selectAll("div.gantt").remove();
      }

      var div = self.container.append("div")
            .attr("class","gantt");

      // Define Div & SVG
      // 1. [Control]
      ctrlDiv = div.append("div").attr("class","control")
        .style("width", function(){
          return self.layout.label.width;
        });
      // 2. [LABEL CAPTION]
      labelCaptionDiv = div.append("div").attr("class","labelCaption");
      // 3. [MAIN CAPTION]
      mainCaptionDiv = div.append("div").attr("class","mainCaption");
      // 4. [TIME AXIS]
      /*
      timeDiv = div.append("div").attr("class","timeAxis");
      self.timeSVG  = timeDiv.append("svg").attr("class","timeAxis")
        .style("width", self.axisWidth)
        .style("height", self.xConfig.axis.height);
       */
      // 4. [MAIN]
      mainDiv = div.append("div").attr("class","main");
      // 5. [LABEL]
      var mainHeight = self.containerHeight -
            self.layout.top -
            self.xConfig.caption.height -
            self.xConfig.scrollbar.height -
            self.xConfig.axis.height;
      labelDiv = mainDiv.append("div").attr("class","gantt-label")
        .style("height", mainHeight)
        .style("overflow-y","auto");
      self.labelTable = labelDiv.append("table")
        .attr("class","gantt");
      // 6. [GANTT]
      /*
      mainDiv = mainDiv.append("div").attr("class","gantt");
      self.mainSVG = mainDiv.append("svg").attr("class","gantt")
        .style("width", self.containerWidth - self.layout.label.width - self.layout.main.margin.right)
        .style("height", mainHeight)
        .append("g")
        .attr("transform", "translate(0," + self.layout.top +")");
       */
    }
    function drawControl(){
      // MOVE LEFT
      ctrlDiv.append("a")
        .attr("class","btn btn-default btn-gantt")
        .attr("id","move-left")
        .attr("href","javascript:void(0);")
        .text("<")
        .on("click", function(){
          var range = self.io.dataManager().getDataRange(self.io.dataManager().getMapper("time"));
          var diff  = (+range[1] - +range[0])*0.1;
          var filter = {}, xcol = self.io.dataManager().getMapper('time');
          filter[xcol] = [+range[0] - diff, +range[1]  - diff];
          self.io.dataManager().setRowRefiner(filter);
        });
      // MOVE RIGHT
      ctrlDiv.append("a")
        .attr("class","btn btn-default btn-gantt")
        .attr("id","move-right")
        .attr("href","javascript:void(0);")
        .text(">")
        .on("click", function(){
          var range = self.io.dataManager().getDataRange(self.io.dataManager().getMapper("time"));
          var diff  = (+range[1] - +range[0])*0.1;
          var filter = {}, xcol = self.io.dataManager().getMapper('time');
          filter[xcol] = [+range[0] + diff, +range[1] + diff];
          self.io.dataManager().setRowRefiner(filter);
        });
    }
    function drawLabelTable(){
      if(self.io.dataManager().getMapper("time") !== "" &&
         self.io.dataManager().getMapper("label") !== "" &&
         self.io.dataManager().getMapper("status") !== ""){
        var labels = self.io.dataManager().getDataRange(self.io.dataManager().getMapper("label"));
        // For X AXIS
        var lineHeight = self.io.designManager().getValue("Height");

        var axis = self.labelTable.append("thead").append("tr").attr("id","time");
        axis.append("td").attr("class", "gantt-label")
          .attr("width", self.layout.label.width);
        axis.append("td").attr("class", "gantt-line");

        var tbody = self.labelTable.append("tbody")
              .attr("height", self.axisHeight);
        labels.forEach(function(d){
          var labelRow = tbody.append("tr").attr("id", d)
                .on("mouseover", function(){
                  d3.select(this).style("background-color", "green");
                  self.drawLine(d);
                })
                .on("mouseout", function(){
                  d3.select(this).style("background-color", null);
                });
          var td = labelRow.append("td")
                .attr("class","gantt-label")
                .attr("width", self.layout.label.width);
          td.append("text").text(d.substring(0,20))
            .on("mouseover", function(){
                 self.tooltip.show(d, d3.mouse(d3.select("contents")[0][0]));})
            .on("mouseout",  self.tooltip.hide());
          labelRow.append("td").attr("class","gantt-line")
            .append("svg")
            .style("height",lineHeight)
            .style("width", self.axisWidth);
        });
      }
    }
  };

  /**
   * draw scatter matrix chart depend on selected items by user
   * @method drawGanttChart
   * @memberOf GanttChart
   */
  GanttChart.prototype.drawGanttChart = function () {
    var self = this;
    var data    = self.io.dataManager().getData();
    var xcolumn = self.io.dataManager().getMapper('time');
    var ycolumn = self.io.dataManager().getMapper('label');
    if(data.length <=0 || _.isEmpty(xcolumn) || _.isEmpty(ycolumn)){
      return;
    }
    // drawX
    self.drawAxis(xcolumn, ycolumn);
    // draw brush
    self.drawBrush();
    // drawLine
    self.drawLine();
  };
  /**
   * For draw axis X, Y
   * @method drawAxis
   * @memberOf GanttChart
   * @returns {undefined}
   */
  GanttChart.prototype.drawAxis = function (xcolumn,ycolumn) {
    var self = this;
    var data = self.io.dataManager().getData();
    var xrange_ =  self.io.dataManager().getDataRange(self.io.dataManager().getMapper("time"));
    var xrange =  [xrange_[0], xrange_[1]];
    self.x = d3.scale.linear().range([0,self.domainWidth]).domain(xrange);
    if(self.io.designManager().getValue("HIGH_LOW")){
      self.y = d3.scale.linear().range([0,10]).domain([0,1]);
    }else{
      self.y = d3.scale.linear().range([0,10]).domain([1,0]);
    }
    drawXAxis();

    function drawXAxis(){
      var table = self.labelTable.select("tr#time");
      var axis =  table.select("td.gantt-line")
            .append("svg")
            .attr("id","time")
            .style("height", self.xConfig.axis.height)
            .style("width", self.axisWidth);
      /// 1.Tick
      var format = getFormat("x");
      var xAxis = d3.svg.axis().scale(self.x).orient("top")
            .ticks(self.io.designManager().getValue("xaxisticknum"))
            .tickFormat(format);
      /// 2. Draw
      var xAxisG = axis.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0,"+ (self.xConfig.axis.height-5 )+ ")");
      xAxisG.call(xAxis);
      xAxisG.selectAll("g.tick").selectAll("text").style("text-anchor", "inherit");
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
   * draw Line
   * @method drawLine
   * @memberOf GanttChart
   */
  GanttChart.prototype.drawLine = function(mouseoverTarget){
    var self = this;
    var data = {};
    var timeKey = self.io.dataManager().getMapper("time");
    var statusKey = self.io.dataManager().getMapper("status");
    var labelKey = self.io.dataManager().getMapper("label");
    var lessThan2labelKeys = [];
    self.io.dataManager().getData().forEach(function(d){
      if(data[d[labelKey]] == undefined){
        data[d[labelKey]] = [];
      }
      data[d[labelKey]].push({time:+d[timeKey],status:+d[statusKey]});
    });

    // update first/last Time
    var firstTime = self.io.dataManager().getDataRange(self.io.dataManager().getMapper("time"))[0];
    var lastTime  = self.io.dataManager().getDataRange(self.io.dataManager().getMapper("time"))[1];
    for(var label in data){
      var first = data[label][0];
      var last  = data[label][data[label].length -1];
      if(first.time > firstTime){
        data[label].unshift({time:firstTime,status:first.status});
      }
      if(last.time < lastTime){
        data[label].push({time:lastTime,status:last.status});
      }
    }
    var labels = self.io.dataManager().getDataRange(self.io.dataManager().getMapper("label"));
    var emptyData = [{time:firstTime, status:0}, {time:lastTime, status:0}];

    var line = d3.svg.line()
          .interpolate("step-after")
          .x(function(d){
            return self.x(d.time);
          })
          .y(function(d){
            return self.y(d.status);
          });
    if(mouseoverTarget){
      self.currentDrawIndex  = labels.indexOf(mouseoverTarget);
      self.limitLower = self.currentDrawIndex - self.limitDiff;
      self.limitUpper = self.currentDrawIndex + self.limitDiff;
    }else{
      self.limitLower = 0;
      self.currentDrawIndex = self.limitDiff;
      self.limitUpper = self.currentDrawIndex + self.limitDiff;
    }
    for(var i=0; i < labels.length; i++){
      if(i > self.limitUpper){
        break;
      }
      if(i >= self.limitLower){
        var label = labels[i];
        if(self.labelTable.selectAll("tr#"+label)
           .select("td.gantt-line").select("path")[0][0] == null){
          self.labelTable.selectAll("tr#"+label)
            .select("td.gantt-line")
            .select("svg")
            .append("path")
            .attr("d", function(){
              if(data[label] == undefined){
                return line(emptyData);
              }
              return line(data[label]);
            })
            .style("fill-opacity", 0.0)
            .style("stroke", function(d){
              return "orange";
            });
        }
      }
    };
    console.timeEnd("Draw");
  };
  /**
   * draw Brush
   * @method drawBrush
   * @memberOf GanttChart
   */
  GanttChart.prototype.drawBrush = function(){
    var self = this;
    if(self.brush === undefined || self.io.isDrilldownMode()){
      self.brush = d3.svg.brush()
        .x(self.x)
        .on("brushstart", function(){
          d3.event.sourceEvent.stopPropagation();
        })
        .on("brushend", function(){
          d3.event.sourceEvent.stopPropagation();
          var filter = {}, xcol = self.io.dataManager().getMapper('time');
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
    self.labelTable.select("svg#time")
      .append("g")
      .attr("class","x brush")
      .call(self.brush)
      .selectAll("rect")
      .attr("y", -10)
      .attr("height", self.xConfig.axis.height + 10);
  };
  return GanttChart;
});
