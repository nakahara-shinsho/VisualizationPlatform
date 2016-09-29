
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
      label  : { label: 'LABEL', type: '', map2: ''},
      status : { label: 'STATUS', type: 'number', map2: ''}
    });

    // Design Manager
    this.io.designManager()
      .setControl("Height", {type:"regx", name: "Line Height", value:10});
    this.io.designManager()
      .setControl("HIGH_LOW", {type:"radio", name: "HIGH & LOW", range:["HIGH/LOW", "LOW/HIGH"],value:"HIGH/LOW"});
    this.io.designManager()
      .setControl("MoveRange", {type:"regx", name: "Move Range (%)", value:10});
    this.io.designManager()
      .setControl("MODE", {type:"radio", name: "RANGE or SOLO", range:["RANGE", "SOLO"],value:"RANGE"});
    this.io.designManager()
      .setControl("NAMEMAP", {type:"radio", name: "Name Map", range:["on", "off"],value:"off"});
    this.io.designManager()
      .setControl("TYPEMAP", {type:"radio", name: "Type Map", range:["on", "off"],value:"off"});
    this.io.designManager()
      .setControl("DETAILMAP", {type:"radio", name: "Detail Map", range:["on", "off"],value:"off"});
    this.io.designManager()
      .setControl("SoloRange", {type:"regx", name: "Solo Range", value:0});
    this.io.designManager()
      .setControl("xaxisCaption", {type:"regx", name:"X AXIS Caption", value:""});
    this.io.designManager()
      .setControl("Zoom", {type:"regx", name: "Zoom(%)", value:10});
    this.io.designManager()
      .setControl("xaxisdigitnum", {type: "regx", name: " X AXIS Digit Number", value:""});
    this.io.designManager()
      .setControl("xaxisticktype", {type: "radio", name: " X AXIS Tick Type", range:["Dec","%","Float","SI","Round","Hex"], value:"Dec"});
    this.beforeRange = [-1, -1];
    this.undoRange = [-1, -1];
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
    self.createChartHeader();
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
      label   : {height: 10, width: 0},
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

    this.tooltipConfig = {
	  caption : "",
	  attributes : [],
	  prefix  : "",
	  postfix : "",
	  offset  : 5
    };
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
    if (self.io.designManager().getValue("NAMEMAP") == "on") {
      var mapperProps = this.io.dataManager().getMapperProps();
      self.io.dataManager().setMapperProps(
	  $.extend({},mapperProps, {name   : { label: 'NAME(option)', type: '', map2: ''}}));      
    }
    if (self.io.designManager().getValue("TYPEMAP") == "on") {
      var mapperProps = this.io.dataManager().getMapperProps();
      self.io.dataManager().setMapperProps(
	  $.extend({},mapperProps, {type   : { label: 'TYPE(option)', type: 'string', map2: ''}}));      
    }
    if (self.io.designManager().getValue("DETAILMAP") == "on") {
      var mapperProps = this.io.dataManager().getMapperProps();
      self.io.dataManager().setMapperProps(
	  $.extend({},mapperProps, {detail   : { label: 'DETAIL(option)', type: '', map2: []}}));      
    }
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
    var ctrlDiv, timeDiv, labelDiv, mainDiv, labelCaptionDiv, mainCaptionDiv, formDiv;
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
      formDiv = div.append("div").attr("class","form-group")
        .style("width", function(){
          return self.layout.label.width;
        });      
      // 2. [LABEL CAPTION]
      labelCaptionDiv = div.append("div").attr("class","labelCaption");
      // 3. [MAIN CAPTION]
      mainCaptionDiv = div.append("div").attr("class","mainCaption");
      // 4. [TIME AXIS]
      // 4. [MAIN]
      mainDiv = div.append("div").attr("class","main");
      mainDiv.append("svg")
        .attr("class", "xaxiscaption")
        .attr("width", self.containerWidth)
        .attr("height", self.xConfig.caption.height)
        .append("g")
        .attr("transform","translate("+self.containerWidth/2+","+ self.xConfig.caption.top+")")
        .append("text").attr("class","xaxis")
        .text(self.io.designManager().getValue("xaxisCaption"));


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
    }
    function drawControl(){
      // MOVE LEFT
      var moveRange = self.io.designManager().getValue("MoveRange") * 0.01;
      ctrlDiv.append("a")
        .attr("class","btn btn-default btn-gantt")
        .attr("id","move-left")
        .attr("href","javascript:void(0);")
        .text("<")
        .on("click", function(){
          var range = self.io.dataManager().getDataRange(self.io.dataManager().getMapper("time"));
          var diff  = (+range[1] - +range[0])*moveRange;
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
          var diff  = (+range[1] - +range[0])*moveRange;
          var filter = {}, xcol = self.io.dataManager().getMapper('time');
          filter[xcol] = [+range[0] + diff, +range[1] + diff];
          self.io.dataManager().setRowRefiner(filter);
        });

      var zoomVal = self.io.designManager().getValue("Zoom") * 0.01;
      // ZOOM IN
      ctrlDiv.append("a")
        .attr("class","btn btn-default btn-gantt")
        .attr("id","zoom-in")
        .attr("href","javascript:void(0);")
        .text("+")
        .on("click", function(){
	  var xcol = self.io.dataManager().getMapper("time")
          var range = self.io.dataManager().getDataRange(xcol);
          var margin  = ((+range[1] + +range[0]) / 2 - (+range[0])) * zoomVal;
	    
          var filter = {};
	  var min, max;
	  min = +range[0] + margin;
	  max = +range[1] - margin;
	  if (min >= max) {
	      max = min + 1;
	  }
          filter[xcol] = [min, max];
          self.io.dataManager().setRowRefiner(filter);
          self.io.dataManager().setDataRange(filter);
        });
      ctrlDiv.append("a")
        .attr("class","btn btn-default btn-gantt")
        .attr("id","zoom-in")
        .attr("href","javascript:void(0);")
        .text("-")
        .on("click", function(){
	  var xcol = self.io.dataManager().getMapper("time");
          var range = self.io.dataManager().getDataRange(xcol);
          var margin  = ((+range[1] + +range[0]) / 2 - (+range[0])) * zoomVal;
	  var filter = {};
	  var min, max;
	  var xdomain = self.x.domain();
	  min = +range[0] - margin;
	  if (min < 0) {
            min = xdomain[0]
	  }
	  max = +range[1] + margin;
          filter[xcol] = [min, max];
          self.io.dataManager().setRowRefiner(filter);
          self.io.dataManager().setDataRange(filter);

        });
      ctrlDiv.append("a")
        .attr("class","btn btn-default btn-gantt")
        .attr("id","zoom-in")
        .attr("href","javascript:void(0);")
        .text("undo")
        .on("click", function(){
	  if (self.undoRange[0] != -1) {
            var xcol = self.io.dataManager().getMapper("time");            
            var filter = {};
            filter[xcol] = [self.undoRange[0], self.undoRange[1]];
            self.io.dataManager().setRowRefiner(filter);
            self.io.dataManager().setDataRange(filter);
          }
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
        labels.sort();
        labels = trimLabel(labels);
        labels.forEach(function(d){
          var newName = self.getName4D3(d);  
          var labelRow = tbody.append("tr").attr("id", newName)
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
          td.append("text").text((d + "").substring(0,20))
            .on("mouseover", function(){
                 self.tooltip.show(d, d3.mouse(d3.select("contents")[0][0]));})
            .on("mouseout",  self.tooltip.hide());
          labelRow.append("td").attr("class","gantt-line")
            .append("svg")
            .style("height",lineHeight)
            .style("width", self.axisWidth);
        });
      function trimLabel(labels) {
       var newLabels = [];
       var labelCol = self.io.dataManager().getMapper("label");
       labels.sort();
       mergeArray(newLabels, labels);
       if (self.lableColumn == labelCol) {
         mergeArray(newLabels, self.labels);
       } 
       self.labels = newLabels;
       self.lableColumn = labelCol
       newLabels.sort();
       function mergeArray(dst, src) {
         var flg = true;
         src.forEach(function(s) {
           flg = true;
           dst.forEach(function(d) {
             if (d == s) {
               flg = false;
             }      
           });
           if (flg == true) {
             dst.push(s)
           }
         });
       }
       return newLabels;
      }
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
    if(_.isEmpty(xcolumn) || _.isEmpty(ycolumn)){
      return;
    }
    // drawX
    self.drawAxis(xcolumn, ycolumn);
    // draw brush
    self.drawBrush();
    // drawLine
    self.drawLine();
  };

  GanttChart.prototype.registerBeforeRange = function (range) {
    var self = this;
    if (self.beforeRange[0] != -1) {
      if ((self.beforeRange[0] != range[0]) || (self.beforeRange[1] != range[1])) {
        self.undoRange[0] = self.beforeRange[0];
        self.undoRange[1] = self.beforeRange[1];
        self.beforeRange[0] = range[0];
        self.beforeRange[1] = range[1];	  
      }
    } else {
      self.beforeRange[0] = range[0];
      self.beforeRange[1] = range[1];
    }
  }
  /**
   * For draw axis X, Y
   * @method drawAxis
   * @memberOf GanttChart
   * @returns {undefined}
   */
  GanttChart.prototype.drawAxis = function (xcolumn,ycolumn) {
    var self = this;
    var data = (self.io.isHighlightMode())? 
            self.io.dataManager().getData(): self.io.dataManager().getFilteredRows();
    var xrange_ = (self.io.isHighlightMode()) ? 
             self.io.dataManager().getDataRange(self.io.dataManager().getMapper("time")):
	  self.io.dataManager().getRowRefiner()[self.io.dataManager().getMapper("time")];
   if (xrange_ == undefined) {
       xrange_ = self.io.dataManager().getDataRange(self.io.dataManager().getMapper("time"))
   }
    var xrange =  [xrange_[0], xrange_[1]];
    self.registerBeforeRange(xrange);
    self.x = d3.scale.linear().range([0,self.domainWidth]).domain(xrange);
    var lineHeight = self.io.designManager().getValue("Height");
    if(self.io.designManager().getValue("HIGH_LOW") == "LOW/HIGH"){
      /*0 : High, 1: Low*/
      self.y = d3.scale.linear().range([0,lineHeight]).domain([0,1]);
    }else{
      /*1 : High, 0: Low*/
      self.y = d3.scale.linear().range([0,lineHeight]).domain([1,0]);
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
  GanttChart.prototype.transformData = function() {
    var self = this;
    var data = {};
    var timeKey = self.io.dataManager().getMapper("time");
    var statusKey = self.io.dataManager().getMapper("status");
    var labelKey = self.io.dataManager().getMapper("label");
    var dataName = self.io.dataManager().getMapper("name");
    var dataType = self.io.dataManager().getMapper("type");    
    var detail = self.io.dataManager().getMapper("detail");    
    var obj;
    var datas = (self.io.isHighlightMode())? 
            self.io.dataManager().getData(): self.io.dataManager().getFilteredRows();
    datas.forEach(function(d){
      if(data[d[labelKey]] == undefined){
        data[d[labelKey]] = [];
      }
      obj = {};
      if (detail != undefined) {
        detail.forEach(function(d2) {
          obj[d2] = d[d2];
        });
      }
      data[d[labelKey]].push({time:+d[timeKey],status:+d[statusKey],name:d[dataName],type:d[dataType], detail:obj});
    });
    if (self.io.designManager().getValue("MODE") == "SOLO") {
      convertSoloData(data);
    }

    return data;
    function convertSoloData(data) {
      var i;
      var obj;
      var lastTime;
      var width = parseFloat(self.io.designManager().getValue("SoloRange"));
      Object.keys(data).forEach(function(key) {
        lastTime =  data[key][data[key].length - 1].time;
        if (data[key].length == 1) {
          obj = $.extend(true, {}, data[key][0]);
          /*Fix for Variable time*/
         obj.time += width; 
          obj.status = 0;
          data[key].splice(1, 0, obj);                    
        } else { 
          for (i = 0; i < data[key].length; i++) {         
            if (data[key][i].time > lastTime) {
              break;
            }
            if (data[key][i].status == 1) {
              obj = $.extend(true, {}, data[key][i]);
              /*Fix for Variable time*/
	      obj.time += width; 
	      if (lastTime < obj.time) {
		  lastTime = obj.time
	      }
              obj.status = 0;
            data[key].splice(i+1, 0, obj);
            }
          }
        }
      });
    }
  };
  /**
   * draw Line
   * @method drawLine
   * @memberOf GanttChart
   */
  GanttChart.prototype.drawLine = function(mouseoverTarget){
    var self = this;
    var data = self.transformData();
    // update first/last Time
    var xrange = (self.io.isHighlightMode()) ? 
             self.io.dataManager().getDataRange(self.io.dataManager().getMapper("time")):
	  self.io.dataManager().getRowRefiner()[self.io.dataManager().getMapper("time")];
   if (xrange == undefined) {
       xrange = self.io.dataManager().getDataRange(self.io.dataManager().getMapper("time"));
   }
    var firstTime = xrange[0];
    var lastTime = xrange[1];

    for(var label in data){
      var first = data[label][0];
      var last  = data[label][data[label].length -1];
      if(first.time > firstTime){
        data[label].unshift({time:firstTime,status:0});
      }
      if(last.time < lastTime){
        data[label].push({time:lastTime,status:last.status});
      }
    }
    var labels = self.io.dataManager().getDataRange(self.io.dataManager().getMapper("label"));
    labels = self.labels; /*ダミーのlabelに関しても線を引く*/
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
        var newName = self.getName4D3(label);
        if(self.labelTable.selectAll("tr#"+newName)
           .select("td.gantt-line").select("path")[0][0] == null){
          var svg = self.labelTable.selectAll("tr#"+newName)
            .select("td.gantt-line")
            .select("svg");
            svg.append("g")
            .append("path")
            .attr("d", function(){
              if(data[label] == undefined){
                return line(emptyData); /*ダミーデータを引く*/
              }
              return line(data[label]);
            })
            .style("fill-opacity", 0.0)
            .style("stroke", function(d){
              return "orange";
            });
	  if (data[label] != undefined) {
	    if (self.io.dataManager().getMapper("type")) {
  	      drawUnderLine(svg, data[label]);
	    }
	    if (self.io.dataManager().getMapper("name")) {
	      svg.selectAll("rect").remove();
	      svg.selectAll("text").remove();
  	      writeDataRect(svg, data[label]);
	      writeDataName(svg, data[label]);
	    }
	  }
        }
      }
    }
    function writeDataRect(svg, data) {
      var i;
      var name = "";
      var range = [];
      var type = "";
      for (i = 0; i < data.length; i++) {
        if (isActive(data[i].status)) {
	  range.push(data[i].time);
          name = data[i].name;
	  type = data[i].type;
	} else {
          if (range.length != 0) {
            range.push(data[i].time);
            drawRect(range, name, type);
            range = [];
	  }
	}
      }
      function drawRect(range, name, type) {
            var lineHeight = self.io.designManager().getValue("Height");
	    var rect = svg.append("g")
	       .append("rect")
	       .attr("y", 0)
	       .attr("x", self.x(range[0]))
	       .attr("width", function() {
		 return self.x(range[(range.length - 1)]) -  self.x(range[0]);
	       })
	       .attr("height", lineHeight)
	       .attr("fill",function() {
  		 return self.io.colorManager().getColor(type);
	       })
	       .style("fill-opacity", 0.5)
//	       .text(name)
	       .on("mousemove", function(d,i){
		 /*tooltip*/
		 var xPosition = d3.mouse(this)[0];
                 var tooltipValue   = parseFloat(self.x.invert(xPosition));
		 var tableData = createTableData(tooltipValue);
		 self.tooltip.show(self.tooltip.table(tableData, self.tooltipConfig), d3.event);
	       })
	       .on("mouseout", function(){
		  self.tooltip.hide();
	       });
      }
    }
    function createTableData(xValue) {
      var tableData = [];
      var data = self.transformData();
      var status = {};
      var detail = self.io.dataManager().getMapper("detail");
      Object.keys(data).forEach(function (key) {
        status[key] = {};
	var name = null;
        data[key].forEach(function (d) {
	  if (name != d.name) {
	    if (d.time <= xValue) {
	      name = d.name;
	      status[key][name] = {};
	      status[key][name].type = d.type;
	      status[key][name].start = d.time;
	      status[key][name].end = 0;
	    }
	  } else {
            if (xValue <= d.time) {
	      if (status[key][name].end == 0) {
 	        status[key][name].detail = d.detail;
	        status[key][name].end = d.time;	    
	      }
            }
	  }
	});
      });
      self.tooltipConfig.caption = "[Time]" + xValue;
      var arrayData = [];
      Object.keys(status).forEach(function(key) {
        var elem = {};
        var name = searchKeyFromIndex(xValue, status[key]);
        if (name != null) {
          arrayData.push({key : "----" + key + "--", value: "  ----"});
          arrayData.push({key : "Time", value: status[key][name].start + "-" + status[key][name].end});

          elem.key = key + ":   ";
  	  elem.color = self.io.colorManager().getColor(status[key][name].type);
	  elem.value = name;

	  Object.keys(status[key][name].detail).forEach(function(k) {
              arrayData.push({key : k + "::", value: status[key][name].detail[k]});
	  });
	  tableData.push(elem);
	}
      });

      self.tooltipConfig.attributes
            = arrayData;
      return tableData;
      function searchKeyFromIndex(xValue, data) {
	var ret = null;
        Object.keys(data).forEach(function(name) {
	  if (xValue >= data[name].start && xValue <= data[name].end) {
	    ret = name;
	  }
	});
	return ret;
      }
    }
    function writeDataName(svg, data) {
      var i;
      var name = "";
      var range = [];
      var position; 
      for (i = 0; i < data.length; i++) {
        if (isActive(data[i].status)) {
          range.push(data[i].time)
          position = data[i].time;
	  name = data[i].name;
        } else {
          if (range.length != 0) { 
            range.push(data[i].time);
	    var xaxisLength = self.x.domain()[1] - self.x.domain()[0];
	    var rangeLength = range[range.length - 1] - range[0];
            if (rangeLength != 0) {
		    var textSvg = svg.append("g")
			.append("text")	    
			.attr("x", self.x(position))
			.attr("y", 10)
			.attr("stroke", function(d) {
			    return "orange";
			})	      
			.attr("font-size", 1);
		if (rangeLength / xaxisLength  >= 0.1) {
			textSvg.text(name);
		}	      
	    }
	    range = [];
	  }
	}

      }
    }
    function drawUnderLine(svg, data) {
      var i;
      var type = "",
	  status,
	  lineData = [];
      var underline = d3.svg.line()
            .interpolate("step-after")
            .x(function(d){
	      return self.x(d.time);
            })
            .y(function(d){
              return self.y((self.io.designManager().getValue("HIGH_LOW") == "LOW/HIGH") );
            });
      for (i = 0; i < data.length; i++) {
	if (isActive(data[i].status)) {
          if (type != data[i].type) {
            lineData.push(data[i]);
	  } else if ( data[i].type != ""){
	    lineData.push(data[i]);
	  } else {

	  }
	} else {
	  if (lineData.length > 0) {
            lineData.push(data[i]);
	    svg.append("g")
	       .append("path")
	       .attr("d", function() {
		 return underline(lineData);
	       })
	       .attr("stroke", function(d) {
  		 return self.io.colorManager().getColor(lineData[0].type);
	       })
	       .attr("stroke-width", 10);
	    lineData = [];
	  }
	  type = "";
	}
      }
      if (lineData.length > 0) {
	svg.append("g")
	   .append("path")
	   .attr("d", function() {
	    return underline(lineData);
	   })
	   .attr("stroke", function(d) {
  	     return self.io.colorManager().getColor(lineData[0].type);
	   })
	   .attr("stroke-width", 5);
      }

    } 
    function isActive(status) {
	if (self.io.designManager().getValue("HIGH_LOW") == "LOW/HIGH") {
          if (status != 0) {
	    return false;
	  } else {
            return true;
	  }
	} else {
          if (status != 0) {
	    return true;
	  } else {
            return false;
	  }
	}
    }
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

  GanttChart.prototype.getName4D3 = function(name)
  {
    var space,
        lp,
        rp,
        slash,
        and,
        newName;
    name = name + ''; /*For Number*/
    newName = name.concat();
    space = searchIndexs(name, " ");
    lp = searchIndexs(name, "(");
    rp = searchIndexs(name, ")");
    slash = searchIndexs(name, "/");
    and = searchIndexs(name, "&");
    newName = generateNewWord(newName, space, " ", "space");
    newName = generateNewWord(newName, lp, "(", "LeftParenthesis");
    newName = generateNewWord(newName, rp, ")", "RightParenthesis");
    newName = generateNewWord(newName, slash, "/", "slash");
    newName = generateNewWord(newName, and, "&", "and");
    newName = replaceHeadNum(newName);
    return newName;
    /**
     * Replace head num 
     * @param word
     */
    function replaceHeadNum(word) {
      var num = word.match(/^\d/);
      if (num != null) {
	return word.replace(/^\d/, "_" + num);
      }
	return word;
    }
    /**
    * Search target indexs
    * @param  word
    * @param  key
    * @return {array index}
    */
    function searchIndexs(word, key) {
      var aindex = [];
      var pos = word.indexOf(key);
      while (pos != -1) {
        aindex.push(pos);
        pos = word.indexOf(key, pos + 1);	
      }
      return aindex;
    }
    /**
    * Convert word
    * @param  word
    * @param  index
    * @param  before key
    * @param  after key
    * @return converted word
    */
    function generateNewWord(word, index, before, after) {
      var pos = word.indexOf(before);
      var ele;
      while (pos != -1) {
	ele = index.shift();
        if (ele == undefined) {
          console.error("Illegal index");
        }
        word = word.replace(before, after + String(ele));
        pos = word.indexOf(before, pos + 1);	
      }
      return word;
    }
  };


  return GanttChart;
});

