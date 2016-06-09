/**
 * @fileoverview implement for BasicChartControl
 * @author Akira Kuroda
 * @version 1.1
 * @copyright Toshiba Corporation
 */

/** @module BasicChartControl*/

/**
 * Initial config additional library files for this chart
 */

/**
 * Create BasicChartControl main function
 * @class BasicChartControl
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {BasicChartControl}
 */
define(["util/CustomTooltip", "css!./style"], function (CustomTooltip) {
  /**
    * Constructor create Bar Chart
    * @method BasicChartControl
    * @memberOf BasicChartControl
    * @returns {BasicChartControl}
    */
  var BasicChartControl = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.setValue({
      selectedLegend : [],
      selectedLabel  : [],
      worker         : {query: "pragma table_info(overview);"}
    });
  };

  /**
    * update chart according with changed of interface variables
    * @method BasicChartControl
    * @memberOf BasicChartControl
    * @returns {BasicChartControl}
    */
  BasicChartControl.prototype.update = function () {
    var self = this;
  };

  /**
   * render BasicChartControl
   * @method render
   * @memberOf BasicChartControl
   */
  BasicChartControl.prototype.render = function (containerElement, containerWidth, containerHeight) {
    // initialize
    this.initialize(containerElement,containerWidth, containerHeight);
    // legendView
    this.drawLegendView();
  };

  /**
   * initialize
   * @method initialize
   * @memberOf BasicChartControl
   */
  BasicChartControl.prototype.initialize = function (containerElement, containerWidth, containerHeight) {
    // Active Flag
    this.actives = {
      legend: { view  :true, // For View Legend
                search:false,// For Legend Search Function
                all   :false // For All Selection / All Unselection
              }
    };
    /** Others **/
    this.color =  d3.scale.ordinal()
      .range(["#62c462","#f89406","#5bc0de", "#ee5f5b"]);

    /** Legend **/
    this.legendConfig = {
      margin:{left:10, top:20},
      rect: {size:20, yInterval:2},
      text: {margin:{left:10, top:15}},
      height :100,
      caption: {name:"Legend", margin:{left:10}}
    };
    // Filter

    this.legendFilter = ["要因第1階層","要因第2階層","要因第3階層"];
    this.initFlag = true;
    this.selectedLegend = [];

    // Container
    this.containerWidth   = containerWidth;
    this.containerHeight  = containerHeight;
    this.containerElement = containerElement;
    if(d3.select(containerElement).select("g.basicChartControl")){
      d3.select(containerElement).select("g.basicChartControl").remove();
    }
    this.container = d3.select(containerElement)
      .append("g")
      .attr("class","basicChartControl");
  };

  BasicChartControl.prototype.drawLegendView = function(){
    var self = this;
    if(self.actives.legend.view){
      // ConvertData
      var data = [];
      self.io.data.forEach(function(d){
        if(self.legendFilter.indexOf(d.name)=== -1){
          data.push(d.name);
        }
      });
      if(self.initFlag){
        self.selectedLegend = data;
        self.initFlag = false;
      }
      // Setup Color
      self.color.domain(data.sort());
      var view = self.container
            .append("div").attr("class","legendView");
      // Caption
      view.append("div")
        .attr("class","caption")
        .append("text")
        .attr("class","legend-caption")
        .attr("x", self.legendConfig.margin.left + self.legendConfig.caption.margin.left)
        .text(self.legendConfig.caption.name);
      // Legend List
      var svg = view.append("div")
            .attr("class","legendList")
            .style("width", self.containerWidth +"px")
            .style("height", function(){
              return self.containerHeight - view.select("div.caption").property("clientHeight") + "px";})
            .style("overflow","auto")
            .append("svg")
            .attr("class","legendList")
            .style("height", function(){
              return (self.legendConfig.rect.size + self.legendConfig.rect.yInterval)*
                data.length;
            });
      var legend = svg.selectAll("g.legend")
            .data(data)
            .enter()
            .append("g")
            .attr("class",function(d){
              if(self.selectedLegend.indexOf(d) === -1){
                return "legend unselect";
       }
       return "legend select";
     })
     .attr("id", function(d){return d;})
     .attr("transform",function(d,i){
       var height = (self.legendConfig.rect.size + self.legendConfig.rect.yInterval)*i;
       return "translate(" + self.legendConfig.margin.left + "," + height + ")";
     })
     .on("click", function(d){
       if(self.selectedLegend.indexOf(d) !== -1){
         d3.select(this).attr("class", "legend unselect");
         self.selectedLegend.splice(self.selectedLegend.indexOf(d),1);
         self.io.setValue("_DEEPLINK_", {"selectedLegend":self.selectedLegend.concat()});
       }else{
         d3.select(this).attr("class", "legend select");
         self.selectedLegend.push(d);
         self.io.setValue("_DEEPLINK_", {"selectedLegend":self.selectedLegend.concat()});
       }
     });
      legend.append("rect")
        .style("width", self.legendConfig.rect.size)
        .style("height", self.legendConfig.rect.size)
        .style("fill", function(d){return self.color(d);});
      legend.append("text")
        .attr("x", self.legendConfig.rect.size +
              self.legendConfig.text.margin.left)
        .attr("y",self.legendConfig.text.margin.top)
        .text(function(d){return d;});
      var max = 0;
      legend.selectAll("text").forEach(function(d){
        if( max < d[0].clientWidth){
          max = d[0].clientWidth;
        }
      });
      var svgWidth = self.legendConfig.margin.left +
            self.legendConfig.rect.size +
            self.legendConfig.text.margin.left + max;
      svg.style("width",svgWidth);
    }
  };
  return BasicChartControl;
});
