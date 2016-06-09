/**
 * @fileoverview implement for SourceCodeView
 * @author Akira Kuroda
 * @version 1.1
 * @copyright Toshiba Corporation
 */

/** @module SourceCodeView*/

/**
 * Initial config additional library files for this chart
 */

/**
 * Create SourceCodeView main function
 * @class SourceCodeView
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {SourceCodeView}
 */
define(["util/CustomTooltip","assets/libs/highlight.pack.js","css!./style"], function (CustomTooltip) {
  /**
    * Constructor create Table Chart
    * @method SourceCodeView
    * @memberOf SourceCodeView
    * @returns {SourceCodeView}
    */
  var SourceCodeView = function (io) {
    this.io = io;

    // Design Mapper
    this.io.designManager()
      .setControl("fontSize", {type:"regx", name:"Font Size", value: 10});
  };

  /**
    * update chart according with changed of interface variables
    * @method SourceCodeView
    * @memberOf SourceCodeView
    * @returns {SourceCodeView}
    */
  SourceCodeView.prototype.update = function (changed) {
    var self = this;
    if(changed.hasOwnProperty("COLOR_MANAGER")){
      self.redraw();
    }else if(changed.hasOwnProperty("DESIGN_MANAGER")){
      self.redraw();
    }else if(changed.hasOwnProperty("DATA_MANAGER")){
      self.redraw();
    }
    // source code type
    if(changed.hasOwnProperty("fontSize")){
      self.container.select("div.hljs")
        .select("code.hljs")
        .style("font-size", self.io.designManager().getValue("fontSize")+ "pt");
    }
  };
  /**
   * redraw
   * @method redraw
   * @memberOf SourceCodeView
   */
  SourceCodeView.prototype.redraw = function () {
    var self = this;
    // create chart header
    self.createHeader();
    // create bare chart
    self.createChart();
    return this.root_dom;
  };
  /**
   * render
   * @method render
   * @memberOf SourceCodeView
   */
  SourceCodeView.prototype.render = function (containerWidth, containerHeight) {
    var self = this;
    // initialize
    self.initialize(containerWidth, containerHeight);
    // create chart header
    self.createHeader();
    // create bare chart
    self.createChart();
    return this.root_dom;
  };
  /**
   * initialize
   * @method initialize
   * @memberOf SourceCodeView
   */
  SourceCodeView.prototype.initialize = function (containerWidth, containerHeight) {
    var self = this;
    /** Layout **/
    self.layout ={
      main:  {margin:{right: 0, left:0, top:20, bottom:10}}
    };
    self.scrollConfig = {
      height: self.io.designManager().getValue("fontSize")*1.5
    };
    /*******************************
     ** Chart Customize Parameter **
     *******************************/
    /** Inner Variable **/
    self.svg       = undefined;
    self.root_dom  = undefined;
    self.container = undefined;
    if(containerWidth !== undefined){
      self.containerWidth = containerWidth;
    }
    if(containerHeight !== undefined){
      self.containerHeight = containerHeight;
    }
    self.codes = [""];
  };

  /**
   * create header of chart
   * @method createHeader
   * @memberOf SourceCodeView
   */
  SourceCodeView.prototype.createHeader = function () {
    var self = this;
    // Initialize
    if(self.root_dom == undefined){
      self.root_dom   = self.root_dom  = document.createElement("div");
      self.container = d3.select(self.root_dom);
    }
    if(self.container.selectAll("div.hljs")){
      self.container.selectAll("div.hljs").remove();
    }
    var width = self.containerWidth -
            self.layout.main.margin.left -
            self.layout.main.margin.right +"px";
    var height = self.containerHeight -
          self.layout.main.margin.top -
          self.layout.main.margin.bottom + "px";
    // Define Div
    self.container.append("div").attr("class","hljs")
      .style("overflow", "auto")
      .style("width", width)
      .style("height",height);
  };

  SourceCodeView.prototype.resize =  function (containerWidth, containerHeight) {
    var self = this;
    // update size
    self.containerWidth  = containerWidth;
    self.containerHeight = containerHeight;
    self.createHeader();
    self.createChart();
  };

  /**
   * create line chart depend on selected items by user
   * @method createChart
   * @memberOf SourceCodeView
   */
  SourceCodeView.prototype.createChart = function () {
    var self = this;
    var sourceCode = self.io.dataManager()._data.data;
    var scrollTarget__ = sourceCode.split("\n")[0];
    sourceCode = sourceCode.replace(scrollTarget__+"\n","");
    var scrollTarget = parseInt(scrollTarget__.replace("/**__SCROLL_TARGET__","").replace("__**/",""));
    var html = hljs.highlightAuto(sourceCode).value;
    self.container.selectAll("div.hljs")
      .append("pre").attr("class","hljs")
      .append("code").attr("class","hljs").attr("id","hljs")
      .style("font-size",self.io.designManager().getValue("fontSize")+ "pt")
      .html(html);
    // auto scroll
    if(scrollTarget !== "NaN" && $("div.hljs").length !== 0){
      var row_top   = scrollTarget*self.scrollConfig.height;
      var top = $('div.hljs').offset().top;
      var now = $('div.hljs').scrollTop();
      var scroll_to = now + row_top - top;
    }
    $("div.hljs").animate({scrollTop: scroll_to});
  };
  return SourceCodeView;
});
