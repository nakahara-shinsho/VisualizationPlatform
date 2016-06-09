/**
 * @fileoverview implement for TableChart
 * @author Akira Kuroda
 * @version 1.1
 * @copyright Toshiba Corporation
 */

/** @module TableChart*/

/**
 * Initial config additional library files for this chart
 */

/**
 * Create TableChart main function
 * @class TableChart
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {TableChart}
 */
define(["util/CustomTooltip","css!./style"], function (CustomTooltip) {
  /**
    * Constructor create Table Chart
    * @method TableChart
    * @memberOf TableChart
    * @returns {TableChart}
    */
  var TableChart = function (io) {
    this.io = io;
    // init interface variables for this chart

    // Outer I/F Values

    // CAPTION
    this.io.setValue("caption","CAPTION");
    this.io.setValue("subCaption","SUB CAPTION");
  };

  TableChart.prototype.renew = function(options, remove){
  };

  /**
    * update chart according with changed of interface variables
    * @method TableChart
    * @memberOf TableChart
    * @returns {TableChart}
    */
  TableChart.prototype.update = function (changedAttr) {
    var self = this;
    // caption
    if(changedAttr.hasOwnProperty("caption")){
      self.captionConfig.caption.name = self.io.getValue("caption");
      self.container.select("svg.table-caption")
        .select("text#table-caption").text(function(){
          if(self.captionConfig.caption.name.length > 0){
            return self.captionConfig.caption.name;
            }
          return "  ";
        });
    }
    // subCaption
    if(changedAttr.hasOwnProperty("subCaption")){
      self.captionConfig.subCaption.name = self.io.getValue("subCaption");
      self.container.select("svg.table-caption")
        .select("text#table-subCaption").text(function(){
          if(self.captionConfig.caption.name.length > 0){
            return self.captionConfig.subCaption.name;
          }
          return "  ";
        });
    }
    // column config
    console.log(changedAttr);
  };

  /**
   * render Table Chart
   * @method render
   * @memberOf TableChart
   */
  TableChart.prototype.render = function (containerWidth, containerHeight) {
    // initialize
    this.initialize(containerWidth, containerHeight);
    if(this.root_dom == undefined){
      this.root_dom   = self.root_dom  = document.createElement("div");
      this.container = d3.select(self.root_dom);
    }
    // convert data
    console.log(this.io.data);
    this.convertData(this.io.data);
    // create chart header
    this.createChartHeader();
    // create bare chart
    this.createTableChart();
    return this.root_dom;
  };
  /**
   * initialize
   * @method initialize
   * @memberOf TableChart
   */
  TableChart.prototype.initialize = function (containerWidth, containerHeight) {
    /** Layout **/
    this.layout ={
      main:  {margin:{right: 0, left:0, top:20, bottom:20}}
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
    /** Inner Variable **/
    this.svg       = undefined;
    this.root_dom  = undefined;
    this.container = undefined;
    this.containerWidth = containerWidth;
    this.containerHeight= containerHeight;
    this.width = undefined;
    this.height= undefined;
    /** SORT **/
    this.sortConfig = {
      key:"C",
      order: "descending"
    };
    /** FILTER **/
    // key, values[];//whitelist
    this.filterConfig = [
      {key:"B", values:["1","10"]}];
    /** Others **/
    this.color =  d3.scale.ordinal()
      .range(["#62c462","#f89406","#5bc0de", "#ee5f5b"]);
  };


  /**
   * Convert received data to understandable data format for this chart
   ** 1.Extract primarykey
   ** 2.Summarize
   * @method convertData
   * @memberOf TableChart
   */
  TableChart.prototype.convertData = function (data) {
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
    // Set Control
    setControl();
    function extractLegend(){
      self.columns = d3.keys(self.data[0]).sort();
      self.color.domain(self.columns);
    }
    function setControl(){
      // CAPTION
      self.io.setControl("caption", {type:"regx", name:"Caption", value:""});
      self.io.setControl("subCaption", {type:"regx", name:"Sub Caption", value:""});
    }
  };

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf TableChart
   */
  TableChart.prototype.createChartHeader = function () {
    var self = this;
    // Initialize
    if(self.container.selectAll("div.table")){
      self.container.selectAll("div.table").remove();
    }
    var captionDiv,headDiv,bodyDiv;
    // Draw Div
    drawDiv();
    // Draw Caption
    drawCaption();

    // Draw
    self.thead = headDiv.append("table")
      .attr("class", "table table-striped table-hover table-bordered");
    self.tbody = bodyDiv.append("table")
      .attr("class", "table table-striped table-condensed table-bordered table-hover");
    function drawDiv(){
      var div = self.container.append("div")
            .attr("class","table");
      var width = self.containerWidth -
            self.layout.main.margin.left -
            self.layout.main.margin.right +"px";
      // Define Div
      captionDiv = div.append("div").attr("class","table-caption");
      headDiv    = div.append("div").attr("class","thead")
        .style("width", width);
      bodyDiv    = div.append("div").attr("class","tbody")
        .style("width", width)
        .style("overflow-y","auto");
    }
    function drawCaption(){
      var caption = captionDiv.append("svg")
            .attr("class","table-caption")
            .attr("width", self.containerWidth)
            .attr("height", self.captionConfig.height);
      caption.append("text").attr("id", "table-caption")
        .attr("transform", "translate("+ self.captionConfig.caption.left + ","
              + self.captionConfig.caption.top + ")")
        .text(function(){
          if(self.captionConfig.caption.name.length > 0){
            return self.io.getValue("caption");
          }
          return "  ";
      });
      caption.append("text").attr("id", "table-subCaption")
        .attr("transform", "translate("+ self.captionConfig.caption.left + ","
              + self.captionConfig.subCaption.top + ")")
        .text(function(){
          if(self.captionConfig.subCaption.name.length > 0){
            return self.io.getValue("subCaption");
          }
          return "  ";
        });
    }
  };

  TableChart.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    this.containerWidth  = containerWidth;
    this.containerHeight = containerHeight;

    // convert data
    this.convertData(this.io.data);
    // create chart header
    this.createChartHeader();
    // create bare chart
    this.createTableChart();
  };

  /**
   * create line chart depend on selected items by user
   * @method createTableChart
   * @memberOf TableChart
   */
  TableChart.prototype.createTableChart = function () {
    var self = this;
    // 1.Create Chart Config
    var config = {};
    extractConfig();
    // 2.Draw Chart
    drawChart();

    // inner method
    function extractConfig(){
      self.columns.forEach(function(key){
        if(isFinite(self.io.data[0][key])){
          config[key] = "Number";
        }else{
          config[key] = "String";
        }
      });
    }
    function drawChart(){
      var chartData = self.io.data;
      // SORT
      //sort();
      // FILTER
      //filter();
      // Table Header
      self.thead.append("thead").append("tr")
        .selectAll("th").attr("class","header")
        .data(self.columns)
        .enter()
        .append("th").attr("class","header")
        //.attr("width", self.io.getValue("columnWidth") + "px")
        .text(function(d){return d;})
        .on("click", function(d){
          console.log("click");
          //
        });
      // Table Body
      self.tbody.append("tbody")
        .selectAll("tr")
        .data(chartData)
        .enter()
        .append("tr")
        .selectAll("td")
        .data(function(row){
          return d3.entries(row);
        })
        .enter()
        .append("td")
        .attr("id", function(d){return d.key;})
        .text(function(d){return d.value;});
      // ScrollBar
      var tbodyHeight = self.height - self.thead.property("clientHeight");
      self.container.select("div.tbody")
        .style("height", tbodyHeight + "px");
      if(tbodyHeight  < self.tbody.property("clientHeight")){
        self.container.select("div.thead")
          .style("width", (self.width - 10) + "px");
      }
      function sort(){
        if(self.sortConfig.key !== undefined){
          if(config[self.sortConfig.key] == "Number"){
            chartData.sort(function(a,b){
              if(self.sortConfig.order == "descending"){
                return d3.descending(Number(a[self.sortConfig.key]),Number(b[self.sortConfig.key]));
              }else if(self.sortConfig.order == "ascending"){
                return d3.ascending(Number(a[self.sortConfig.key]),Number(b[self.sortConfig.key]));
              }
              return 1;

            });
          }else{
            chartData.sort(function(a,b){
              if(self.sortConfig.order == "descending"){
                return d3.descending(a[self.sortConfig.key],b[self.sortConfig.key]);
              }else if(self.sortConfig.order == "ascending"){
                return d3.ascending(a[self.sortConfig.key],b[self.sortConfig.key]);
              }
              return 1;
            });
          }
        }
      }
      function filter(){
        if(self.filterConfig.length > 0){
          var filter;
          chartData = chartData.filter(function(row){
            for(var i=0; i<self.filterConfig.length; i++){
              filter = self.filterConfig[i];
              if(filter.values.indexOf(row[filter.key]) === -1){
                return false;
              }
            }
            return true;
          });
        }
      }
    }
  };
  return TableChart;
});
