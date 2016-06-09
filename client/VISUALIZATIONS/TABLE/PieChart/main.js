/**
 * @fileoverview implement for PieChart
 * @author Akira Kuroda
 * @version 5.0
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
define(["util/CustomTooltip",
        "css!./style.css"], function (CustomTooltip) {
  /**
    * Constructor create PieChart
    * @method PieChart
    * @memberOf PieChart
    * @returns {PieChart}
    */
  var PieChart = function (io) {
    this.io = io;

    // Data Mapper
    this.io.dataManager().setMapperProps({
      category: {type: 'string', label:'Category', map2:''},
      value   : {type: 'number', label:'Value', map2:''}
    });

    // Design Mapper
  };

  /**
    * update chart according with changed of interface variables
    * @method PieChart
    * @memberOf PieChart
    * @returns {PieChart}
    */
  PieChart.prototype.update = function (changed) {
    var self = this;
    if(changed.hasOwnProperty("COLOR_MANAGER")){
      self.redraw();
    }else if(changed.hasOwnProperty("DESIGN_MANAGER")){
      self.redraw();
    }else if(changed.hasOwnProperty("DATA_MANAGER")){
      self.redraw();
    }
    return root_dom;
  };

  PieChart.prototype.getSelectedLegends = function (refresh) {
    var self = this;
    var selectedLegends = [];
    if(self.io.isHighlightMode()) {
      selectedLegends = undefined;
    }else{
      selectedLegends = self.io.dataManager().getRowRefiner("category");
    }
    return selectedLegends;
  };
  /**
   * render Chart
   * @method render
   * @memberOf PieChart
   */
  PieChart.prototype.render = function (containerWidth, containerHeight) {
    var self = this;
    // initialize
    self.initialize(containerWidth, containerHeight);
    self.createHeader();
    var data = self.transformData();
    self.createChart(data);
    return self.root_dom;
  };

  /**
   * redraw Chart
   * @method redraw
   * @memberOf PieChart
   */
  PieChart.prototype.redraw = function () {
    var self = this;
    self.createHeader();
    var data = self.transformData();
    self.createChart(data);
    return self.root_dom;
  };
  /**
   * initialize
   * @method initialize
   * @memberOf PieChart
   */
  PieChart.prototype.initialize = function (containerWidth, containerHeight) {
    /** Layout **/
    this.layout ={
      top  : 20,
      yaxis: {width: 80},
      main:  {margin:{right: 25}}
    };
    /*******************************
     ** Chart Customize Parameter **
     *******************************/

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
    this.root_dom  = undefined;
    this.container = undefined;
    this.containerWidth = containerWidth;
    this.containerHeight= containerHeight;
    this.radius = Math.min(containerWidth, containerHeight) / 2;
    this.total = 0;
    /** Others **/
    this.animation = 500;
  };

  PieChart.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    var self = this;
    self.containerWidth  = containerWidth;
    self.containerHeight = containerHeight;
    self.radius = Math.min(containerWidth, containerHeight) / 2;
    self.redraw();
  };

  /**
   * Transform received data to understandable data format for this chart
   * @method transformData
   * @memberOf PieChart
   */
  PieChart.prototype.transformData = function () {
    var self = this;
    var chartData = [],
        category= self.io.dataManager().getMapper("category"),
        value = self.io.dataManager().getMapper("value");
    if(_.isEmpty(category) && _.isEmpty(value)){
      return chartData;
    }
    var targets =self.getSelectedLegends();
    self.io.dataManager().getData().forEach(function(d){
      var elem = {};
      elem.category =  d[category];
      elem.value    = +d[value];
      self.total +=  elem.value;
      if( _.isEmpty(targets) || targets.indexOf(category) !== -1){
        chartData.push(elem);
      }
    });
    return chartData;
  };

  /**
   * create header of chart
   * @method createHeader
   * @memberOf PieChart
   */
  PieChart.prototype.createHeader = function () {
    var self = this;
    // Initialize
    if(!self.root_dom){
      self.root_dom   = self.root_dom  = document.createElement("div");
      self.container = d3.select(self.root_dom);
    }
    if(self.container.selectAll("div.pieChart")){
      self.container.selectAll("div.pieChart").remove();
    }

    self.svg = self.container
      .append("div").attr("class","pieChart")
      .append("svg").attr("class","pieChart")
      .attr("width", self.containerWidth)
      .attr("height", self.containerHeight)
      .append("g")
      .attr("transform", "translate(" + self.containerWidth / 2 + "," + self.containerHeight / 2 + ")");
  };

  /**
   * create bar chart depend on selected items by user
   * @method creatChart
   * @memberOf PieChart
   */
  PieChart.prototype.createChart = function (data) {
    var self = this;
    var arc = d3.svg.arc()
        .outerRadius(self.radius - 10)
        .innerRadius(0);

    var labelArc = d3.svg.arc()
        .outerRadius(self.radius - 40)
        .innerRadius(self.radius - 40);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) {
          return d.value; });

    var g = self.svg.selectAll(".arc")
          .data(pie(data))
          .enter().append("g")
          .attr("class", "arc");

    g.append("path")
      .attr("d", arc)
      .style("fill", function(d) {
        var colName = self.io.colorManager().getDomainName();
        /*if(
          (self.io.dataManager().getMapper("category").indexOf(colName) !== -1 ||
           self.io.dataManager().getMapper("value").indexOf(colName) !== -1 ) &&
           self.io.dataManager().getRowRefiner("category").indexOf(d.data[colName]) !== -1 )*/
        {
           return self.io.colorManager().getColor(d.data[colName]);
        }
        //return "darkgray";
      })
      .on("mouseover", function(d){
        d3.select(this).style("fill-opacity", 0.7);
        var tableData = createTableData(d);
        self.tooltip.show(self.tooltip.table(tableData,self.tooltipConfig), d3.event);
      })
      .on("mouseout", function(d){
        d3.select(this).style("fill-opacity", 1);
        self.tooltip.hide();
      });
    g.append("text")
      .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .text(function(d) { return d.value + "(" + calcRatio(d.value) + ")"; });

    function createTableData(d){
      var tableData = [];
      var elem = {};
      elem.key = d.data.category;
      var ratio = (d.value / self.total)*100;
      ratio = parseInt(ratio * 10) /10 + "%";
      elem.value = " : " + d.value + "(" + ratio +")";
      var colName = self.io.colorManager().getDomainName();
      if(self.io.dataManager().getMapper("category").indexOf(colName) !== -1 ||
         self.io.dataManager().getMapper("value").indexOf(colName) !== -1){
        elem.color = self.io.colorManager().getColor(d.data[colName]);
      }else{
        elem.color = "darkgray";
      }
      tableData.push(elem);
      return tableData;
    }
    function calcRatio(data){
      var ratio = (data / self.total)*100;
      return parseInt(ratio * 10) /10 + "%";
    }
  };

 /**
   * mode Selector by user
   * @method mode
   * @memberOf PieChart
   */
  PieChart.prototype.mode = function (mode) {
    if(mode){
      this._mode = mode;
      this.redraw();
    }
    return this._mode;
  };
  return PieChart;
});
