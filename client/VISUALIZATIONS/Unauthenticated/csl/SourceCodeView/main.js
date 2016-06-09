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
    // init interface variables for this chart

    // Outer I/F Values

    // CAPTION
    this.io.setValue("caption","CAPTION");
    this.io.setValue("subCaption","SUB CAPTION");
    this.io.setValue("fontSize", 10);
    this.io.setValue("__query__", {});
  };

  SourceCodeView.prototype.renew = function(options, remove){
  };

  /**
    * update chart according with changed of interface variables
    * @method SourceCodeView
    * @memberOf SourceCodeView
    * @returns {SourceCodeView}
    */
  SourceCodeView.prototype.update = function (changedAttr) {
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
    // source code type
    if(changedAttr.hasOwnProperty("fontSize")){
      self.container.select("div.hljs")
        .select("code.hljs")
        .style("font-size", self.io.getValue("fontSize")+ "pt");
    }
    // change Files
    // move Line
    if(changedAttr.hasOwnProperty("__query__")){
      self.io.getValue("__query__").query.forEach(function(d){
        if($.isNumeric(d.value)){
          // Line Number
          var line = Math.floor(d.value);
          var linePosition = self.io.getValue("fontSize") * (line -1);
          $("div.hljs").animate({scrollTop:linePosition});
        }else{
          // File Name
          self.createChartHeader();
          self.createSourceCodeView();
        }
      });
    }
  };

  /**
   * render Table Chart
   * @method render
   * @memberOf SourceCodeView
   */
  SourceCodeView.prototype.render = function (containerWidth, containerHeight) {
    // initialize
    this.initialize(containerWidth, containerHeight);
    if(this.root_dom == undefined){
      this.root_dom   = self.root_dom  = document.createElement("div");
      this.container = d3.select(self.root_dom);
    }
    // convert data
    this.convertData();
    // create chart header
    this.createChartHeader();
    // create bare chart
    this.createSourceCodeView();
    return this.root_dom;
  };
  /**
   * initialize
   * @method initialize
   * @memberOf SourceCodeView
   */
  SourceCodeView.prototype.initialize = function (containerWidth, containerHeight) {
    /** Layout **/
    this.layout ={
      main:  {margin:{right: 0, left:0, top:20, bottom:100}}
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

    this.codes = [""];
  };


  /**
   * Convert received data to understandable data format for this chart
   ** 1.Extract primarykey
   ** 2.Summarize
   * @method convertData
   * @memberOf SourceCodeView
   */
  SourceCodeView.prototype.convertData = function () {
    var self = this;
    setDesigner();

    function setDesigner(){
      // CAPTION
      self.io.setDesigner("caption", {type:"regx", name:"Caption", value:""});
      self.io.setDesigner("subCaption", {type:"regx", name:"Sub Caption", value:""});
      self.io.setDesigner("fontSize", {type:"regx", name:"Font Size", value:  self.io.getValue("fontSize")});
    }
  };

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf SourceCodeView
   */
  SourceCodeView.prototype.createChartHeader = function () {
    var self = this;
    // Initialize
    if(self.container.selectAll("div.hljs")){
      self.container.selectAll("div.hljs").remove();
    }
    if(self.container.selectAll("div.table-caption")){
      self.container.selectAll("div.table-caption").remove();
    }
    var captionDiv,mainDiv;
    // Draw Div
    drawDiv();
    // Draw Caption
    drawCaption();


    function drawDiv(){
      var div = self.container.append("div");
      var width = self.containerWidth -
            self.layout.main.margin.left -
            self.layout.main.margin.right +"px";
      var height = self.containerHeight -
            self.layout.main.margin.top -
            self.layout.main.margin.bottom + "px";
      // Define Div
      captionDiv = div.append("div").attr("class","table-caption");
      mainDiv    = div.append("div").attr("class","hljs")
        .style("overflow", "auto")
        .style("width", width)
        .style("height",height);
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

  SourceCodeView.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    this.containerWidth  = containerWidth;
    this.containerHeight = containerHeight;
    this.createChartHeader();
    this.createSourceCodeView();
  };

  /**
   * create line chart depend on selected items by user
   * @method createSourceCodeView
   * @memberOf SourceCodeView
   */
  SourceCodeView.prototype.createSourceCodeView = function () {
    var self = this;
    drawChart();
    function drawChart(){
      var html = hljs.highlightAuto(self.io.data).value;
      self.container.selectAll("div.hljs")
        .append("pre").attr("class","hljs")
        .append("code").attr("class","hljs").attr("id","hljs")
        .style("font-size",self.io.getValue("fontSize")+ "pt")
        .html(html);
    };
  };
  return SourceCodeView;
});
