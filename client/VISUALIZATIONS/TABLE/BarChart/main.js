/**
 * @fileoverview implement for BarChart
 * @author Akira Kuroda
 * @version 5.0
 * @copyright Toshiba Corporation
 */

/** @module BarChart*/

/**
 * Initial config additional library files for this chart
 */

/**
 * Create BarChart main function
 * @class BarChart
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {BarChart}
 */
define(["util/CustomTooltip",
        "css!./BarChart"], function (CustomTooltip) {
  /**
    * Constructor create Bar Chart
    * @method BarChart
    * @memberOf BarChart
    * @returns {BarChart}
    */
  var BarChart = function (io) {
    this.io = io;

    // Data Mapper
    this.io.dataManager().setMapperProps({
      xaxis: {type: 'string', label: 'X axis' , map2: ''},
      yaxis: {type: 'number', label: 'Y axis' , map2:[] }
    });

    // Design Mapper
    this.io.designManager()
      .setControl("graphType", {type:"radio", name:"Graph Type", range:["stacked", "grouped","normalized"], value: "stacked"});
    this.io.designManager()
      .setControl("clickmode", {type:"radio",name:"Click Mode", range:["single","multi"], value:"single"});
    this.io.designManager()
      .setControl("xaxisCaption", {type:"regx", name:"X AXIS Caption", value:"__DEFAULT__"});
    this.io.designManager()
      .setControl("xaxisCaptionFontsize", {type:"regx", name:"X AXIS Caption Font-Size", value:11});
    this.io.designManager()
      .setControl("yaxisCaption", {type:"regx", name:"Y AXIS Caption", value:"Y-AXIS"});
    this.io.designManager()
      .setControl("yaxisticknum", {type:"regx", name:"Y AXIS TICKS NUM", value: 3});
    this.io.designManager()
      .setControl("sortmode", {type:"radio", name:"SORT MODE"      , range:["VALUE", "NONE"], value:"NONE"});
    this.io.designManager()
      .setControl("xaxisLabelHeight", {type:"regx", name:"X AXIS Label Height", value: 100});
    this.io.designManager().setControl("yaxisRangeMaxAuto"  , {type:"radio", name:"Y AXIS Max (Auto)",range:["ON", "OFF"], value:"ON"});
    this.io.designManager().setControl("yaxisRangeMaxManual", {type:"regx", name:"Y AXIS Max (Manual)", value:100});
    this.io.designManager().setControl("yaxisRangeMinAuto"  , {type:"radio", name:"Y AXIS Min (Auto)",range:["ON", "OFF"], value:"OFF"});
    this.io.designManager().setControl("yaxisRangeMinManual", {type:"regx", name:"Y AXIS Min (Manual)", value: 0});
    this.io.designManager()
      .setControl("yaxisticktype", {type: "radio", name: " Y AXIS Tick Type", range:["Dec","%","Float","SI","Round","Hex"], value:"Dec"});
    this.io.designManager()
      .setControl("yaxisdigitnum", {type: "regx", name: " Y AXIS Digit Number", value:""});
    this.io.designManager()
      .setControl("xaxisLabelFocus", {type:"selection", name:"X Axis Label Focused By Value ", range:[], value: []});
    this.io.designManager().setControl("rectClickable"  , {type:"radio", name:"RECTANGLE CLICKBLE ",range:["ON", "OFF"], value:"OFF"});
  };

  /**
    * update chart according with changed of interface variables
    * @method BarChart
    * @memberOf BarChart
    * @returns {BarChart}
    */
  BarChart.prototype.update = function (changed) {
    var self = this;
    if(changed.hasOwnProperty("COLOR_MANAGER")){
      if(self.beforeColorColumnName == self.io.colorManager().getDomainName()){
        updateColors();
      }else{
        self.redraw();
      }
    }else if(changed.hasOwnProperty("DESIGN_MANAGER")){
      self.redraw();
    }
    if(changed.hasOwnProperty("DATA_MANAGER")){
      if(changed.DATA_MANAGER.MAPPER !== undefined){
        self.io.dataManager().setColumnRefiner(self.io.dataManager().getMapperProps("yaxis").map2);
      }
      if(changed.DATA_MANAGER.SELECTOR !== undefined &&
         changed.DATA_MANAGER.SELECTOR.length > 0){
        var selectedLegends = self.getSelectedLegends();
        self.io.designManager()
          .setControl("xaxisLabelFocus", {type:"selection", name:"X Axis Label Focused By Value ",
                                          range: selectedLegends});
      }
      self.redraw();
    }
    function updateColors(){
      self.svg.selectAll("rect")
        .transition().duration(self.animation)
        .style("fill", function(d){
          if(self.io.colorManager().getDomainName() !== "Y axis"){
            return self.io.colorManager().getColorOfRow(d.color);
          }
          return self.io.colorManager().getColor(d.name);
        });
    }
  };

  BarChart.prototype.getSelectedLegends = function (refresh) {
    var self = this;
    var selectedLegends = [];
    if(self.io.isHighlightMode() || refresh !== undefined) {
      selectedLegends = self.io.dataManager().getMapperProps("yaxis").map2.concat();
    }else{
      var selectedColumns = self.io.dataManager().getColumnRefiner();
      var ycols = self.io.dataManager().getMapperProps("yaxis").map2;
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
   * render Bar Chart
   * @method render
   * @memberOf BarChart
   */
  BarChart.prototype.render = function (containerWidth, containerHeight) {
    var self = this;
    // initialize
    self.initialize(containerWidth, containerHeight);
    // Reset SelectedLabel
    var targetColumn = self.io.dataManager().getMapperProps("xaxis").map2;
    self.io.dataManager().setRowRefiner(targetColumn,null);
    //  Update Control
    var selectedLegends = self.getSelectedLegends(true);
    /** Control **/
    self.io.designManager()
      .setControl("xaxisLabelFocus", {type:"selection", name:"X Axis Label Focused By Value ",
                                      range: selectedLegends});
    if(self.io.designManager().getValue("xaxisCaption") == "__DEFAULT__"){
      self.io.designManager().setValue("xaxisCaption", self.io.dataManager().getMapperProps("xaxis").map2);
    }
    self.createHeader();
    var data = self.transformData(true);
    self.createChart(data);
    return self.root_dom;
  };

  /**
   * redraw Bar Chart
   * @method redraw
   * @memberOf BarChart
   */
  BarChart.prototype.redraw = function () {
    var self = this;
    self.createHeader();
    var data = self.transformData();
    self.createChart(data);
    return self.root_dom;
  };
  /**
   * initialize
   * @method initialize
   * @memberOf BarChart
   */
  BarChart.prototype.initialize = function (containerWidth, containerHeight) {
    /** Layout **/
    this.layout ={
      top  : 20,
      yaxis: {width: 80},
      main:  {margin:{right: 25}}
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
    // Y AXIS [height - XAxis_height]
    this.yConfig = {
      scale: "basic", // ["basic", "log"]
      caption : {top:-60, left:"auto"}
    };
    /** X AXIS **/
    // X AXIS [width - YAxis_width]
    this.xConfig = {
      sort    : {key: "total", order: "descending"},
      label   : {upper:100, minimumWidth: 16},
      caption : {height:30, top:20, left:"auto"},
      scrollbar: {height:25}
    };
    /** Tooltip **/
    this.tooltipConfig = {
      caption : "",
      attributes : [],
      prefix  : "",
      postfix : ""
    };
    /** Mode **/
    this._mode = "drilldown"; // ["highlight","drilldown"]
    /** Inner Variable **/
    // VIEW
    this.tooltip      = new CustomTooltip();
    this.tooltip.initialize();
    this.svg          = undefined;
    this.ySvg         = undefined;
    this.root_dom  = undefined;
    this.container = undefined;
    this.containerWidth = containerWidth;
    this.containerHeight= containerHeight;

    /** Others **/
    this.animation = 500;
    // X AXIS
    // -Label Domain
    this.xLabel = d3.scale.ordinal();
    // -Grouped Domain
    this.xGroupLabel = d3.scale.ordinal();
    this.xAxis = d3.svg.axis().scale(this.xLabel).orient("bottom");

    this.beforeColorColumnName = undefined;
  };

  BarChart.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    var self = this;
    self.containerWidth  = containerWidth;
    self.containerHeight = containerHeight;
    self.redraw();
  };

  /**
   * Transform received data to understandable data format for this chart
   * @method transformData
   * @memberOf BarChart
   */
  BarChart.prototype.transformData = function (refresh) {
    var self = this;
    // 1. Setup Axis Height
    self.axisHeight   = self.containerHeight -
      self.xConfig.caption.height -
      self.io.designManager().getValue("xaxisLabelHeight") -
      self.xConfig.scrollbar.height;
    self.y = d3.scale.linear().range([self.axisHeight,0]);
    self.yAxis = d3.svg.axis().scale(self.y).orient("left");

    // 2. Transform Data to Chart Format
    if(self.io.dataManager().getMapperProps("xaxis").map2 == '' ||
       self.io.dataManager().getMapperProps("yaxis").map2 === undefined ||
       self.io.dataManager().getMapperProps("yaxis").map2.length == 0){
      return [];
    }

    return chartData(refresh);

    // inner method
    function chartData(refresh){
      var chartData = [];
      var selectedLegends = self.getSelectedLegends(refresh);
      self.beforeColorColumnName = self.io.colorManager().getDomainName();
      var graphType       = self.io.designManager().getValue("graphType");
      var total = 1;
      self.io.dataManager().getData().forEach(function(d){
        var element = {};
        element.key = d[self.io.dataManager().getMapperProps("xaxis").map2];
        selectedLegends.forEach(function(k){
          element[k] = d[k];
          total += +d[k];
          if(self.io.colorManager().getDomainName() !== "Y Axis"){
            element["__color__"] = {};
            element["__color__"][self.io.colorManager().getDomainName()] = d[self.io.colorManager().getDomainName()];
          }
        });
        chartData.push(element);
      });

      if((selectedLegends !== undefined) &&
         (selectedLegends.length > 0 )){
           var y0List = {};
           if(graphType == "stacked" ||graphType == "normalized"){
             chartData.forEach(function(d){
               if(y0List[d.key] === undefined){
                 y0List[d.key] = 0;
               }
               d.group = selectedLegends.map(function(name){
                 return {key: d.key, name: name, y0:y0List[d.key], y1: y0List[d.key] += +d[name], color: d["__color__"]};
               });
               d.total = d.group[d.group.length - 1].y1;
               y0List[d.key] = d.group[d.group.length - 1].y1;
               if(graphType == "normalized"){
                 d.group.forEach(function(e) {
                   e.y0 /= d.total;
                   e.y1 /= d.total;
                 });
               }
             });
           }else if(graphType == "grouped"){
             chartData.forEach(function(d){
               d.group = selectedLegends.map(function(name){
                 if(y0List[d.key+"__"+name] === undefined){
                   y0List[d.key+"__"+name] = 0;
                 }
                 return {key: d.key, name: name,  y0:y0List[d.key+"__"+name], y1: y0List[d.key+"__"+name] += +d[name], color: d["__color__"]};
               });
               d.total = 0;
               d.group.forEach(function(e){
                 d.total += e.y1;
               });
             });
           }
         }
      return chartData;
    }
  };

  /**
   * create header of chart
   * @method createHeader
   * @memberOf BarChart
   */
  BarChart.prototype.createHeader = function () {
    var self = this;
    // Initialize
    if(self.root_dom == undefined){
      self.root_dom   = self.root_dom  = document.createElement("div");
      self.container = d3.select(self.root_dom);
    }
    if(self.container.selectAll("div.barchart")){
      self.container.selectAll("div.barchart").remove();
    }
    var yaxisDiv,mainDiv,xaxiscaptionDiv;
    // Draw Div
    drawDiv();
    // Draw yAxisCaption
    drawXAxisCaptionSVG();
    var mainHeight = self.containerHeight -
          self.xConfig.caption.height -
          self.xConfig.scrollbar.height;
    // Draw yAxis
    drawYAxisSVG();
    // Draw Main
    self.svg = mainDiv.append("svg")
      .attr("class", "barchart")
      .style("width", self.containerWidth -
             self.layout.yaxis.width - self.layout.main.margin.right)
      .style("height", mainHeight)
      .append("g")
      .attr("transform", "translate(0," + self.layout.top +")");


    function drawDiv(){
      var barDiv = self.container.append("div")
            .attr("class","barchart");
      // Define Div
      yaxisDiv      = barDiv.append("div")
        .attr("class","barchart-yaxis")
        .style("width", function(){
          return self.layout.yaxis.width;
        });
      mainDiv       = barDiv.append("div")
        .attr("class","barchart-main")
        .style("width", function(){
          return self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right +"px";
        })
        .style("overflow-x","auto");
      xaxiscaptionDiv = barDiv.append("div")
        .attr("class","barchart-xaxis-caption");
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
        .text(self.io.designManager().getValue("xaxisCaption"))
        .on("click", function(){
          self.io.designManager().setControl('xaxisCaption', d3.event);
        });
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
   * create bar chart depend on selected items by user
   * @method creatChart
   * @memberOf BarChart
   */
  BarChart.prototype.createChart = function (data) {
    var self = this;
    console.log("[WARNING]:: BASIC/LOG SCALE!!!");
    // 1. Sort   Data
    sortData();
    // 2. Draw   Axis
    self.drawAxis(data);
    // 3. Draw   Chart
    self.drawChart(data);
    function sortData(){
      if(self.io.designManager().getValue("sortmode") == "VALUE"){
        data = data.sort(function(a,b){
          if(self.xConfig.sort.order === "descending"){
            return d3.descending(a[self.xConfig.sort.key], b[self.xConfig.sort.key]);
          }
          return d3.descending(a[self.xConfig.sort.key], b[self.xConfig.sort.key]);
        });
      }
    }
  };

  /**
   * draw x axis and y axis of chart
   * @method drawAxis
   * @memberOf BarChart
   * @returns {undefined}
   **/
  BarChart.prototype.drawAxis = function (data) {
    var self = this;
    if(data.length == 0){
        return;
    }
    var graphType = self.io.designManager().getValue("graphType");
    // Setup xLabel range
    var axisWidth = self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right;
    var labels = data.map(function(d){return d.key;});
    labels = labels.filter(function(d,i,self){ return self.indexOf(d) === i & i !==self.lastIndexOf(d);});
    if(labels.length > self.xConfig.label.upper){
      axisWidth = self.xConfig.label.minimumWidth * labels.length;
      self.container.select("svg.barchart").style("width", axisWidth +"px");
    }
    self.xLabel = d3.scale.ordinal().rangeBands([0,axisWidth], 0.1);
    // Setup Axis
    self.xLabel.domain(labels);
    var ymax,ymin;
    if(graphType == "normalized"){
      ymax = 1;
      ymin = 0;
      if(self.io.designManager().getValue("yaxisRangeMaxAuto") == "OFF"){
        ymax = (parseInt(self.io.designManager().getValue("yaxisRangeMaxManual")) /100);
      }
      if(self.io.designManager().getValue("yaxisRangeMinAuto") == "OFF"){
        ymin = (parseInt(self.io.designManager().getValue("yaxisRangeMinManual"))/100);
      }
      self.y.domain([ymin,ymax]);
    }else{
      ymax = 0;
      ymin = 0;
      var tmp  = 0;
      if(graphType == "stacked"){
        if(self.io.designManager().getValue("yaxisRangeMinAuto") == "ON"){
          tmp = d3.min(data,function(d){ return +d.total;});
          if(tmp < ymin && tmp < 0){
            ymin = tmp;
          }
        }else{
            ymin = self.io.designManager().getValue("yaxisRangeMinManual");
        }
        if(self.io.designManager().getValue("yaxisRangeMaxAuto") == "ON"){
          ymax = d3.max(data,function(d){ return +d.total;});
        }else{
          ymax = self.io.designManager().getValue("yaxisRangeMaxManual");
        }
      }else if(graphType == "grouped"){
        var selectedLegends = [];
        if(self.io.isHighlightMode()) {
          selectedLegends = self.io.dataManager().getMapperProps("yaxis").map2;
        }else{
          selectedLegends = self.io.dataManager().getColumnRefiner();
        }
        selectedLegends.forEach(function(key){
          tmp = self.io.dataManager().getDataRange(key);
          if(self.io.designManager().getValue("yaxisRangeMinAuto") == "ON"){
            if(tmp[0] < 0 && tmp[0] <ymin){
              ymin = tmp[0];
            }
          }else{
            ymin = self.io.designManager().getValue("yaxisRangeMinManual");
          }
          if(self.io.designManager().getValue("yaxisRangeMaxAuto") == "ON"){
            var ymaxList = {};
            var ymaxTmp = 0;
            data.forEach(function(d){ ymaxTmp += +d[key];});
            if(ymaxTmp > ymax){
              ymax = ymaxTmp;
            }
          }else{
            ymax = self.io.designManager().getValue("yaxisRangeMaxManual");
          }
        });
        self.xGroupLabel.domain(selectedLegends)
          .rangeRoundBands([0, self.xLabel.rangeBand()]);
      }
      self.y.domain([ymin, ymax]);
    }
    // Initialize X Axis
    var xAxis = d3.svg.axis().scale(self.xLabel).orient("bottom");
    // Initialize Y Axis
    var yAxis = d3.svg.axis().scale(self.y).orient("left");
    yAxis.ticks(self.io.designManager().getValue("yaxisticknum"));
    var format = "";
    if(graphType == "normalized"){
      var digit = self.io.designManager().getValue("yaxisdigitnum");
      if(digit !== ""){
        format = "."+digit + "%";
      }else{
        format = ".0%";
      }
    }else{
      var sign  = self.axisConfig[self.io.designManager().getValue("yaxisticktype")];
      var digit = self.io.designManager().getValue("yaxisdigitnum");
      if(digit !== ""){
        if(sign == "x"){
          format = "#0"+digit+sign;
        }else{
          format = "."+digit+sign;
        }
      }
    }
    yAxis.ticks(self.io.designManager().getValue("yaxisticknum"))
      .tickFormat(d3.format(format));

    // Create X Axis
    /// Add X Axis Label Action
    self.svg.append("g")
      .attr("class","x axis")
      .attr("transform", "translate(0," + (self.axisHeight) + ")")
      .call(xAxis)
      .selectAll("text")
      .attr("id", function(d){
        return d;
      })
      .style("text-anchor", "start")
      .attr("dx",".5em")
      .attr("dy","-.3em")
      .attr("transform","rotate(90)")
      .attr("font-size",
            self.io.designManager().getValue("xaxisCaptionFontsize")+"pt" )
      .style("fill", function(d){
        var refiner = self.io.dataManager().getRowRefiner(d);
        var array = refiner[self.io.dataManager().getMapperProps("xaxis").map2];
        if(array !== undefined && array.indexOf(d) !== -1){
          return "orange";
        }
        return null;
      })
      .on("click",function(d){
        self.clickXAxisLabel(d);
      });
    self.ySvg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("class"," yaxiscaption")
      .attr("transform", "rotate(-90)")
      .attr("y", self.yConfig.caption.top)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(self.io.designManager().getValue("yaxisCaption"))
      .on("click" ,function(){
        self.io.designManager().setControl('yaxisCaption', d3.event);
      });
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
  };

  BarChart.prototype.drawChart = function(baseData){
    var self = this;
    // DRAW CHART
    ////  FILTERED FOR RECT
    var highlights = self.io.dataManager().getMapperProps("yaxis").map2;
    if(self.io.isHighlightMode()){
      highlights = self.io.dataManager().getColumnRefiner();
    }
    var data = baseData.filter(function(d){return d.total > 0;});
    if(data.length > 0){
      var bar = self.svg.selectAll(".g_barchart")
            .data(data)
            .enter().append("g")
            .attr("class", "g_barchart")
            .attr("transform", function(d){
              return "translate(" + self.xLabel(d.key) + ",0)";});
      bar.selectAll("rect")
        .data(function(d){return d.group;})
        .enter().append("rect")
        .attr("id", function(d){
          return d.key;
        })
        .attr("class", function(d){
          if(highlights.indexOf(d.name) !== -1){
            return "_" + d.name.replace(/ /g, "_") + " rect_barchart";
          }
          return "_" + d.name.replace(/ /g, "_") + " rect_barchart hideme";
        })
        .attr("width", function(d){
          return getParameter("width");
        })
        .attr("y", self.axisHeight)
        .attr("height", 0)
        .style("fill", function(d){
          if(self.io.colorManager().getDomainName() !== "Y axis"){
            return self.io.colorManager().getColorOfRow(d.color);
          }
          return self.io.colorManager().getColor(d.name);

        })
        .style("fill-opacity", 1.0)
        .on("click", function(d){
          self.clickXAxisLabel(d.key);
          self.clickRect(d);
        })
        .on("mouseover", function(d,i){
          d3.select(this).style("fill-opacity", 0.7);
          var targetData = baseData.filter(function(e){
            return d.key == e.key;
          });
          var tableData = createTableData(targetData, d);
          self.tooltip.show(self.tooltip.table(tableData,self.tooltipConfig), d3.event);
        })
        .on("mouseout", function(d,i){
          d3.select(this).style("fill-opacity", 1);
          self.tooltip.hide();
        })
        .transition().duration(self.animation)
        .attr("x", function(d){
          return getParameter("x", d);
        })
        .attr("y", function(d) {
          return getParameter("y", d);
        })
        .attr("height", function(d){
          return getParameter("height", d);
        });
    }
    // Update X AXIS Label (Zero)
    var chartXLabel = [];
    var chartXLabelSpecNEZero = [];
    var targetColumns = self.io.designManager().getValue("xaxisLabelFocus");
    data.forEach(function(d){
      for(var i=0; i <targetColumns.length;i++){
        if( d[targetColumns[i]] !== undefined && +d[targetColumns[i]] !== 0){
          chartXLabelSpecNEZero.push(d.key);
          break;
        }
      };
      chartXLabel.push(d.key);
    });
    self.svg.selectAll("g.x.axis")
      .selectAll("text")
      .attr("class", function(d){
        if(chartXLabel.indexOf(d) === -1){
          return "x axis zero";
        }
        return "x axis";
      })
      .style("fill", function(d){
        var refiner = self.io.dataManager().getRowRefiner(d);
        var array = refiner[self.io.dataManager().getMapperProps("xaxis").map2];
        if(array !== undefined && array.indexOf(d) !== -1){
          return "orange";
        }
        return null;
      })
      .style("text-decoration", function(d){
        if(chartXLabelSpecNEZero.indexOf(d) !== -1){
          return "underline";
        }
        return null;
      })
      .text(function(d){
        if(chartXLabelSpecNEZero.indexOf(d) !== -1){
          return "★"+ d;
        }
        return d;
      })
      .on("mouseover", function(key){
        var targetData = baseData.filter(function(d){
          return d.key == key;
        });
        var tableData = createTableData(targetData);
        self.tooltip.show(self.tooltip.table(tableData,self.tooltipConfig), d3.event);
      })
      .on("mouseout", function(){
        self.tooltip.hide();
      });

    function createTableData(data, target){
      var total = d3.max(data, function(d){ return +d.total;});
      var highlights = self.io.dataManager().getMapperProps("yaxis").map2;
      if(self.io.isHighlightMode()){
        highlights = self.io.dataManager().getColumnRefiner();
      }
      if(target !== undefined){
        return getDetails();
      }
      return getSummary();

      function getSummary(){
        var tableData = [];
        var legendsKey   = [];
        var legendsTotal = {};
        var legendsColor = {};
        data.forEach(function(d){
          if(legendsKey.length === 0){
            d.group.forEach(function(g){
              legendsTotal[g.name] = 0;
              legendsKey.push(g.name);
              legendsColor[g.name] = d.__color__;
            });
          }
          legendsKey.forEach(function(key){
            legendsTotal[key] += +d[key];
          });
          if(total < d.total){
            total = d.total;
          }
        });
        // COLUMN
        for(var key in legendsTotal){
          var elem   = {};
          elem.key   = key;
          if(self.io.designManager().getValue("graphType") !== "normalized"){
            elem.value = legendsTotal[key];
          }else{
            var ratio = parseInt(+legendsTotal[key]/total*1000)/10;
            elem.value = legendsTotal[key] + "("+ ratio +"%)";
          }
          if(highlights.indexOf(key) !== -1){
            if(self.io.colorManager().getDomainName() !== "Y axis"){
              elem.color = self.io.colorManager().getColorOfRow(legendsColor[key]);
            }else{
              elem.color = self.io.colorManager().getColor(key);
            }
          }
          tableData.push(elem);
        }

        self.tooltipConfig.caption = data[0].key;
        self.tooltipConfig.attributes
          = [{key : "Total", value: total}];

        return tableData;
      }
      function getDetails(){
        var tableData = [];
        var targetFlag = false;
        data.forEach(function(d){
          d.group.forEach(function(g){
            var elem = {};
            targetFlag = false;
            if(g == target){
              targetFlag = true;
            }
            elem.key = g.name;
            if(self.io.designManager().getValue("graphType") !== "normalized"){
              elem.value = d[g.name];
            }else{
              var ratio = parseInt(d[g.name]/total*1000)/10;
              elem.value = d[g.name] + "("+ ratio +"%)";
            }
            if(highlights.indexOf(g.name) !== -1){
              if(self.io.colorManager().getDomainName() !== "Y axis"){
                elem.color = self.io.colorManager().getColorOfRow(d.__color__);
              }else{
                elem.color = self.io.colorManager().getColor(g.name);
              }
            }
            if(targetFlag){
              elem.fontWeight = "900";
            }
            tableData.push(elem);
          });
        });
        self.tooltipConfig.caption = data[0].key;
        self.tooltipConfig.attributes
          = [{key : "Total", value: total}];

        return tableData;
      }
    }
    /**
     * calculate parameter for each graphtype
     * @method getParameter
     * @memberOf getParameter
     */
    function getParameter(mode, d){
      var graphType = self.io.designManager().getValue("graphType");
      switch (mode) {
      case "width":
        if(graphType == "stacked" || graphType == "normalized"){
          return self.xLabel.rangeBand();
        }else if(graphType == "grouped"){
          return self.xGroupLabel.rangeBand();
        }
        break;
      case "x":
        if(graphType == "grouped"){
          return self.xGroupLabel(d.name);
        }
        break;
      case "y":
        if(graphType == "stacked" || graphType == "normalized"){
          if(d.y1 !== undefined){
            if(self.y(d.y1) <= self.axisHeight){
              return self.y(d.y1);
            }else{
              return self.axisHeight;
            }
          }
        }else if(graphType == "grouped"){
          if(self.y(d.y1) <= self.axisHeight){
            return self.y(d.y1);
          }else{
            return self.axisHeight;
          }
        }
        break;
      case "height":
        var height;
        if(graphType == "stacked" || graphType == "normalized"){
          height = self.y(d.y0) - self.y(d.y1);
          if (self.y(d.y0) > self.axisHeight){
            height = self.axisHeight - self.y(d.y1);
          }else if(self.y(d.y1)> self.axisHeight){
            height = 0;
          }
          return height;
        }else if(graphType == "grouped"){
          height = self.y(d.y0) - self.y(d.y1);
          if (self.y(d.y0) > self.axisHeight){
            height = self.axisHeight - self.y(d.y1);
          }else if(self.y(d.y1)> self.axisHeight){
            height = 0;
          }
          return height;
        }
        break;
      default:
        console.log("[Error]:: Unsupported Mode "+ mode);
      }
      return null;
    }
  };

 /**
   * click X Axis label
   * @method clickXAxisLabel
   * @memberOf BarChart
   */
  BarChart.prototype.clickXAxisLabel = function(key){
    var self = this;
    var targetColumn = self.io.dataManager().getMapperProps("xaxis").map2;
    var pos = -1;
    var array = [];

    if(self.io.dataManager().getRowRefiner(targetColumn).length !== undefined){
      pos = self.io.dataManager().getRowRefiner(targetColumn).indexOf(key);
    }
    if(self.io.designManager().getValue("clickmode") == "single"){
      /// SINGLE SELECTION ///
      if(pos == -1){
        array.push(key);
      }else{
        array = null;
      }
      self.io.dataManager().setRowRefiner(targetColumn,array);
    }else if(self.io.designManager().getValue("clickmode") == "multi"){
      /// MULTI SELECTION ///
      array = self.io.dataManager().getRowRefiner(targetColumn);
      if(pos == -1){
        array.push(key);
      }else{
        array.splice(pos,1);
        if(array.length == 0){
          array = null;
        }
      }
      self.io.dataManager().setRowRefiner(targetColumn,array);
    }
  };
 /**
   * click Rect
   * @method clickRect
   * @memberOf BarChart
   */
  BarChart.prototype.clickRect = function(d){
    var self = this;
    if(self.io.designManager().getValue("rectClickable") === "ON"){
      var selectedLegends = self.io.dataManager().getColumnRefiner();
      var pos = selectedLegends.indexOf(d.name) ;
      if(pos !== -1){
        selectedLegends.splice(pos,1);
      }else{
        selectedLegends.push(d.name);
      }
      self.io.dataManager().setColumnRefiner(selectedLegends);
    }
  };
 /**
   * mode Selector by user
   * @method mode
   * @memberOf BarChart
   */
  BarChart.prototype.mode = function (mode) {
    if(mode){
      this._mode = mode;
      this.redraw();
    }
    return this._mode;
  };
  return BarChart;
});
