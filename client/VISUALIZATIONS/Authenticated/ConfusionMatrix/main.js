/**
 * @fileOverview implement for ConfusionMatrix
 * @author Akira Kuroda
 * @version 1.1
 * @copyright Toshiba Corporation
 */

/** @module ConfusionMatrix*/

/**
 * Create ConfusionMatrix main function
 * @class ConfusionMatrix
 * @returns {ConfusionMatrix}
  */
define([], function() {
    /**
     * Constructor create ConfusionMatrics Chart
     * @method ConfusionMatrix
     * @memberOf ConfusionMatrix
     * @param {type} options parameters
     * @returns {ConfusionMatrix}
     */
  var ConfusionMatrix = function(io) {
    this.io = io;
    
  };

  ConfusionMatrix.prototype.update = function(changed){
  };

 /**
  * initialize
  * @method initialize
  * @memberOf BarChart
  */
  ConfusionMatrix.prototype.initialize = function (containerWidth, containerHeight) {
    // define width and height of drawing area
    this.margin = {top: 20, left: 20, right: 20};
    this.containerWidth  = containerWidth;
    this.containerHeight = containerHeight;
    this.root_dom = undefined;

    this.data = [];
    this.selectedLegends = ["NO_DETECTED_NORMAL","DETECTED_NORMAL","NO_DETECTED_NORMAL","NO_DETECTED_NORMAL"];
    this.rectSize  = {
      width : (this.containerWidth/2 - this.margin.left),
      height: (this.containerHeight/2 - this.margin.top)
    };
    /** Mode **/
    this._mode = "highlight";
  };

  /**
   * render Confusion Matrix Chart
   * @method render
   * @memberOf BarChart
   */
  ConfusionMatrix.prototype.render = function (containerWidth, containerHeight) {
    var self = this;
    // initialize
    self.initialize(containerWidth, containerHeight);
    if(self.root_dom == undefined){
      self.root_dom   = self.root_dom  = document.createElement("div");
      self.container = d3.select(self.root_dom);
    }
    createChart();


    function createChart(){
      var mainDiv;
      convertData();
      drawDiv();
      drawMain();

      /***** private function **********/
      // convert data
      function convertData(){
        var originalData = self.io.dataManager().getData()[0];
        var total = parseInt(originalData.total);
        var elem = {};
        var tmp  = 0.0;
        for(var key in originalData){
          if(key !== "total"){
            elem = {key: key, value: originalData[key], ratio: 0};
            tmp = (parseFloat(originalData[key])/ total) * 100;
            elem.ratio = Math.round(tmp * 10) / 10;
            self.data.push(elem);
          }
        }
      }
      // draw div
      function drawDiv(){
        var rootDiv = self.container.append("div")
              .attr("class","confusionMatrix")
              .style("width", self.containerWidth)
              .style("height", self.containerHeight);
        // Main Div
        mainDiv = rootDiv.append("div").attr("class","confusionMatrix-main");
      }

      function drawMain(){
        mainDiv.append("svg")
          .attr("class", "confusionMatrix")
          .transition().duration(500)
          .style("width", self.containerWidth)
          .style("height", self.containerHeight - self.margin.top);
        self.data.forEach(function(val){
          var info = self.calcInfo(val.key);
          var main = mainDiv.select("svg.confusionMatrix");
          main.append("rect").attr("id",val.key)
            .attr("x", info.rectX)
            .attr("y", info.rectY)
            .style("width", self.rectSize.width +"px")
            .style("height", self.rectSize.height + "px")
            .style("fill", info.color)
            .style("fill-opacity", function(){
              if(self.selectedLegends.indexOf(val.key) !== -1){
                return 1.0;
              }
              return 0.5;
            })
            .on("mouseover", function(){
              /*
              var this__ =  d3.select(this);
              this__.style("stroke","yellow");
              this__.style("stroke-width","2px");
              main.select("text.confusionMatrixTitle_"+ val.key)
                .style("fill", "yellow");
              main.select("text.confusionMatrixValue_"+ val.key)
                .style("fill", "yellow");
               */
            })
            .on("mouseout", function(){
              /*
              var this__ =  d3.select(this);
              this__.style("stroke-width","0px");
              main.select("text.confusionMatrixTitle_"+ val.key)
                .style("fill",function(){
                  if(self.selectedLegends.indexOf(val.key) !== -1){
                    return "#000000";
                  }
                  return null;
                });
              main.select("text.confusionMatrixValue_"+ val.key)
                .style("fill", function(){
                  if(self.selectedLegends.indexOf(val.key) !== -1){
                    return "#000000";
                  }
                  return null;
                });
               */
            })
            .on("click", function(){
              clickAction(main, val);
            });
          main.append("text")
            .attr("class", function(){return "confusionMatrixTitle_"+val.key;})
            .attr("x", info.textX)
            .attr("y", info.textY)
            .attr("text-anchor","middle")
            .style("fill",function(){
              if(self.selectedLegends.indexOf(val.key) !== -1){
                return "#ffffff";
              }
              return "#000000";
            })
            .text(val.key)
            .on("click", function(){
              clickAction(main, val);
            });
          main.append("text")
            .attr("class", function(){return "confusionMatrixValue_"+val.key;})
            .attr("x", info.textX)
            .attr("y", info.textY + 15)
            .attr("text-anchor","middle")
            .style("fill",function(){
              if(self.selectedLegends.indexOf(val.key) !== -1){
                return "#ffffff";
              }
              return "#000000";
            })
            .text(val.value + "件 [" + val.ratio+ " %]")
            .on("click", function(){
              clickAction(main, val);
            });
        });
      }
      function clickAction(main, val){
        if(self.selectedLegends.indexOf(val.key) !== -1){
          main.select("rect#"+val.key).style("fill-opacity",0.5);
          var index = self.selectedLegends.indexOf(val.key);
          main.select("text.confusionMatrixTitle_"+ val.key)
            .style("fill","#000000");
          main.select("text.confusionMatrixValue_"+ val.key)
            .style("fill","#000000");
          self.selectedLegends.splice(index,1);
          self.io.dataManager().setValue("fourth_quadrant", self.selectedLegends.concat());
        }else{
          main.select("rect#"+val.key).style("fill-opacity",1);
          main.select("text.confusionMatrixTitle_"+ val.key)
            .style("fill","#ffffff");
          main.select("text.confusionMatrixValue_"+ val.key)
            .style("fill","#ffffff");
          self.selectedLegends.push(val.key);
          self.io.dataManager().setValue("fourth_quadrant", self.selectedLegends.concat());
        }
      }
    }
    return this.root_dom;
  };
  ConfusionMatrix.prototype.calcInfo = function (id){
    var self = this;
    var info = {
      rectX: undefined,
      rectY: undefined,
      textX: undefined,
      textY: undefined,
      color: undefined
    };
    switch (id){
    case "DETECTED_NORMAL":
      info.rectX = self.margin.left;
      info.rectY = self.margin.top;
      info.textX = self.margin.left + self.rectSize.width/2;
      info.textY = self.rectSize.height/2 + self.margin.top;
      info.color = "#5bc0de";
      break;
    case "NO_DETECTED_NORMAL":
      info.rectX = self.margin.left + self.rectSize.width;
      info.rectY = self.margin.top;
      info.textX = self.margin.left + (self.rectSize.width/2) + self.rectSize.width;
      info.textY = self.rectSize.height/2 + self.margin.top;
      info.color = "#62c462";
      break;
    case "DETECTED_FAILURE":
      info.rectX = self.margin.left;
      info.rectY = self.rectSize.height + self.margin.top;
      info.textX = self.margin.left + self.rectSize.width/2;
      info.textY = (self.rectSize.height/2)*3 + self.margin.top;
      info.color = "#f89406";
      break;
    case "NO_DETECTED_FAILURE":
      info.rectX = self.margin.left + self.rectSize.width;
      info.rectY = self.rectSize.height + self.margin.top;
      info.textX = self.margin.left + (self.rectSize.width/2) + self.rectSize.width;
      info.textY = (self.rectSize.height/2)*3 + self.margin.top;
      info.color = "#ee5f6b";
      break;
    }
    return info;
  };

  ConfusionMatrix.prototype.resize = function(containerWidth, containerHeight) {
    // update size
    var self = this;
    self.containerWidth  = containerWidth;
    self.containerHeight = containerHeight;
    self.rectSize  = {
      width : (self.containerWidth/2 -  self.margin.left),
      height: (self.containerHeight/2 - self.margin.top)
    };
    // create bare chart
    self.redraw();
  };
  ConfusionMatrix.prototype.redraw = function(){
    var self = this;
    var rootDiv = self.container.select("div.confusionMatrix");
    rootDiv.style("width", self.containerWidth)
      .style("height", self.containerHeight);
    rootDiv.select("svg.confusionMatrix-caption")
      .style("width", self.containerWidth);

    rootDiv.select("div.confusionMatrix-main")
      .style("width", self.containerWidth)
      .style("height", self.containerHeight);
    self.data.forEach(function(val){
        var info = self.calcInfo(val.key);
      var main = rootDiv.select("svg.confusionMatrix")
            .style("width", self.containerWidth)
            .style("height", self.containerHeight);
      main.select("rect#"+val.key)
        .attr("x", info.rectX)
        .attr("y", info.rectY)
        .style("width", self.rectSize.width +"px")
        .style("height", self.rectSize.height + "px")
        .style("fill", info.color);
      main.select("text.confusionMatrixTitle_"+val.key)
        .attr("x", info.textX)
        .attr("y", info.textY);
      main.select("text.confusionMatrixValue_"+val.key)
        .attr("x", info.textX)
        .attr("y", info.textY + 15);
    });
  };
  return ConfusionMatrix;
});
