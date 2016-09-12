/**
 * @fileoverview implement for ParallelCoordinates
 * @author Akira Kuroda
 * @version 5.0
 * @copyright Toshiba Corporation
 */

/** @module ParallelCoordinates*/

/**
 * Initial config additional library files for this chart
 */

/**
 * Create ParallelCoordinates main function
 * @class ParallelCoordinates
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {ParallelCoordinates}
 */
define(["util/CustomTooltip",
        "css!./style.css"], function (CustomTooltip) {
  /**
    * Constructor create ParallelCoordinates
    * @method ParallelCoordinates
    * @memberOf ParallelCoordinates
    * @returns {ParallelCoordinates}
    */
  var ParallelCoordinates = function (io) {
    this.io = io;

    // Data Mapper
    this.io.dataManager().setMapperProps({
      //columnsString: {type: 'string', label: 'Columns(String)', map2:[]},
      axiscolumns: { label: 'Axises', map2:[], spk: '100'}
    });

    // Design Mapper
    this.io.designManager().setControl('scale', {type: 'combox', range:[1,2,3,4,5], value:1});

    this.tooltip      = new CustomTooltip();
    this.tooltip.initialize();
  };

  /**
    * update chart according with changed of interface variables
    * @method ParallelCoordinates
    * @memberOf ParallelCoordinates
    * @returns {ParallelCoordinates}
    */
  ParallelCoordinates.prototype.update = function (changed) {
    var self = this;
    if(changed.hasOwnProperty("COLOR_MANAGER")){
      self.redraw();
    }else if(changed.hasOwnProperty("DESIGN_MANAGER")){
      self.redraw();
    }
    if(changed.hasOwnProperty("DATA_MANAGER")){
      self.redraw();
    }
  };

  /**
   * render Chart
   * @method render
   * @memberOf ParallelCoordinates
   */
  ParallelCoordinates.prototype.render = function (containerWidth, containerHeight) {
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
   * @memberOf ParallelCoordinates
   */
  ParallelCoordinates.prototype.redraw = function () {
    var self = this;
    self.createHeader();
    var data = self.transformData();
    self.createChart(data);
    return self.root_dom;
  };
  /**
   * initialize
   * @method initialize
   * @memberOf ParallelCoordinates
   */
  ParallelCoordinates.prototype.initialize = function (containerWidth, containerHeight) {
    var self = this;
    self.margin = {top: 30, right: 10, bottom: 30, left: 10, axisBottom: 40};
    self.containerWidth  = containerWidth  - self.margin.right - self.margin.left;
    self.containerHeight = containerHeight - self.margin.top - self.margin.bottom;
    /*******************************
     ** Chart Customize Parameter **
     *******************************/
    self.optionData = {
      ticks_format: ".2s"
    };

    self._mode = "highlight";
    self.x = d3.scale.ordinal().rangePoints([0, self.containerWidth], 1);
    self.y = {};
    self.background = undefined;
    self.foregroune = undefined;
    self.dragging = {};
    self.line = d3.svg.line().interpolate("cardinal").tension(0.86);
    self.axis = d3.svg.axis().orient("left");
    self.labelLength = 14;
    self.axisG = undefined;
    self.columnsStringLabel2Value = {};
    self.columnsStringValue2Label = {};

    /** Tooltip **/
    self.tooltipConfig = {
      caption : "",
      attributes : [],
      prefix  : "",
      postfix : ""
    };
  };

  ParallelCoordinates.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    var self = this;
    self.initialize(containerWidth, containerHeight);
    self.redraw();
  };

  /**
   * Transform received data to understandable data format for this chart
   * @method transformData
   * @memberOf ParallelCoordinates
   */
  ParallelCoordinates.prototype.transformData = function () {
    var self = this;
    var chartData = [],
        dataManager = self.io.dataManager(), 
        dataTypes = dataManager.getDataType();

    if((dataManager.getMapperProps("axiscolumns").map2 === undefined ||
        dataManager.getMapperProps("axiscolumns").map2.length === 0) ){
          return chartData;
        }
    var selectedLegends = self.getSelectedLegends();
    var row = {};
    self.columnsStringLabel2Value = {};

    // create SORTed list for string column
    dataManager.getData().forEach(function(data){
      row = {};
      selectedLegends.forEach(function(colName){
        if(dataTypes[colName] !== 'number'){
          // Update Label2Value for colName & return data
          row[colName] = self.label2value(colName, data[colName]);
        }
      });
    });
    selectedLegends.forEach(function(colName){
        if(dataTypes[colName] !== 'number'){
	    //console.log(JSON.stringify(self.columnsStringLabel2Value[colName]))
	    self.columnsStringLabel2Value[colName] = self.sortStringLabel(self.columnsStringLabel2Value[colName]);
	    var labelNum = 0;
	    for (var key in  self.columnsStringLabel2Value[colName]){
		labelNum += 1;
		self.columnsStringValue2Label[colName][labelNum] = key;
		self.columnsStringLabel2Value[colName][key] = labelNum;
	    }
	    //console.log(JSON.stringify(self.columnsStringLabel2Value[colName]))
	}
    });
    // push chart data
    dataManager.getData().forEach(function(data){
      row = {};
      selectedLegends.forEach(function(colName){
        if(dataTypes[colName] !== 'number'){
          // Update Label2Value for colName & return data
          row[colName] = self.label2value(colName, data[colName]);
        }else{
          row[colName] = data[colName];
        }
      });
      chartData.push(row);
    });
    return chartData;
  };
  /**
   * Transform received data(String) to data(Value)
   * @method label2value
   * @memberOf ParallelCoordinates
   */
  ParallelCoordinates.prototype.label2value = function (colName, elem){
    var self = this;
    if(self.columnsStringLabel2Value[colName] === undefined){
      self.columnsStringLabel2Value[colName] = {};
      self.columnsStringValue2Label[colName] = {};
    }
    if(self.columnsStringLabel2Value[colName][elem] === undefined){
      var labelNum = 0;
      for (var key in  self.columnsStringLabel2Value[colName]){
        labelNum += 1;
      }
      // create Label2Value
      self.columnsStringLabel2Value[colName][elem] = labelNum + 1;
      // create Value2Label
      self.columnsStringValue2Label[colName][labelNum+1] = elem;
    }
    return self.columnsStringLabel2Value[colName][elem];
  };
  /**
   * create header of chart
   * @method createHeader
   * @memberOf ParallelCoordinates
   */
  ParallelCoordinates.prototype.createHeader = function () {
    var self = this;
    // Initialize
    if(!self.root_dom){
      self.root_dom   = self.root_dom  = document.createElement("div");
      self.container = d3.select(self.root_dom);
    }
    if(self.container.selectAll("div.parallelCoordinates")){
      self.container.selectAll("div.parallelCoordinates").remove();
    }
    if(self.container.selectAll("div.parallelCoordinatesButton")){
      self.container.selectAll("div.parallelCoordinatesButton").remove();
    }
    var div = self.container
          .append("div").attr("class", "parallelCoordinates");
    div.append("h1").attr("id","selectNum");
    self.svg = div.append("svg")
      .attr("width", self.containerWidth)
      .attr("height", self.containerHeight)
      .append("g")
      .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
    
    return;
  };
  ParallelCoordinates.prototype.sortStringLabel = function (object) {
      //戻り値用新オブジェクト生成
      var sorted = {};
      //キーだけ格納し，ソートするための配列生成
      var array = [];
      //for in文を使用してオブジェクトのキーだけ配列に格納
      for (key in object) {
          //指定された名前のプロパティがオブジェクトにあるかどうかチェック
          if (object.hasOwnProperty(key)) {
              //if条件がtrueならば，配列の最後にキーを追加する
              array.push(key);
          }
      }
      //配列のソート
      array.sort(); 
      //配列の逆ソート
      //array.reverse();
      
      //キーが入った配列の長さ分だけfor文を実行
      for (var i = 0; i < array.length; i++) {
          /*戻り値用のオブジェクトに
            新オブジェクト[配列内のキー] ＝ 引数のオブジェクト[配列内のキー]を入れる．
            配列はソート済みなので，ソートされたオブジェクトが出来上がる*/
          sorted[array[i]] = object[array[i]];
      }
      //戻り値にソート済みのオブジェクトを指定
      //      console.log(JSON.stringify(sorted));
      return sorted;
  }

  /**
   * create bar chart depend on selected items by user
   * @method creatChart
   * @memberOf ParallelCoordinates
   */
  ParallelCoordinates.prototype.createChart = function (data) {
    var self = this;
    var labels = [];
    for(var label in data[0]){
      labels.push(label);
    }
    self.dimensions = d3.keys(data[0]).filter(function(d) {
      var index = labels.indexOf(d);
      return (index != -1) && (self.y[d] = d3.scale.linear()
                               .domain(d3.extent(data, function(p) {return +p[d]; }))
                               .range([self.containerHeight - self.margin.axisBottom, 0]));
    });
    self.x.domain(self.dimensions);
    
    // Draw Line
    drawLines();

    // Draw Dragging Function
    drawDragging();

    // Draw Axis
    drawAxis();

    function drawLines(){
      if(self.io.isHighlightMode()) {
        self.background = self.svg.append("g")
          .attr("class", "background")
          .selectAll("path")
          .data(data).enter().append("path")
          .attr("d", path);
      }
      // Add blue foreground lines for focus.
      self.foreground = self.svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(data).enter()
        .append("path")
        .attr("d", path)
        .style("stroke", function(d){
          return getColor(d);})
        .on("mouseover", function(d){
          d3.select(this).style("stroke-width", 5);
          var tableData = createTableData(d);
          self.tooltip.show(self.tooltip.table(tableData,self.tooltipConfig), d3.event);
        })
        .on("mouseout", function(){
          d3.select(this).style("stroke-width", 1);
          self.tooltip.hide();
        });

      function createTableData(d){
        var tableData = [];
        for(var key in d){
          var elem = {};
          elem.key = key;
          elem.value = " : " + d[key];
          elem.color = getColor(d);
          tableData.push(elem);
        }
        return tableData;
      }

      function getColor(d){
        var color = {};
        var target = self.io.colorManager().getDomainName(),
            dataTypes = self.io.dataManager().getDataType();
        if(!_.isEmpty(target)) {
          if(dataTypes[target] !== 'number'){
            color[target] = self.columnsStringValue2Label[target][d[target]];
            return self.io.colorManager().getColorOfRow(color);
          }else {
            color[target] = d[target];
            return self.io.colorManager().getColorOfRow(color);
          }
        }
        return "lightgray";
      }
    }

    function drawDragging(){
      // Add a group element for each dimension.
      self.axisG = self.svg.selectAll(".dimension")
            .data(self.dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("id", function(d){return d;})
            .attr("transform", function(d) { return "translate(" + self.x(d) + ")"; })
            .on("click", function(d){
              console.log("click");
            })
            .call(d3.behavior.drag()
                  .origin(function(d) { return {x: self.x(d)}; })
                  .on("dragstart", function(d) {
                    self.dragging[d] = self.x(d);
                    self.background.attr("visibility", "hidden");
                  })
                  .on("drag", function(d) {
                    self.dragging[d] = Math.min(self.containerWidth, Math.max(0, d3.event.x));
                    self.foreground.attr("d", path);
                    self.dimensions.sort(function(a, b) { return position(a) - position(b); });
                    self.x.domain(self.dimensions);
                    g.attr("transform", function(d) { return "translate(" + position(d) + ")"; });
                  })
                  .on("dragend", function(d) {
                    delete self.dragging[d];
                    transition(d3.select(this)).attr("transform", "translate(" + self.x(d) + ")");
                    transition(self.foreground).attr("d", path);
                    self.background
                      .attr("d", path)
                      .transition()
                      .delay(500)
                      .duration(0)
                      .attr("visibility", null);
                  }));
    }
    function drawAxis(){
      // Add an axis and title.
      self.axisG.append("g")
        .attr("class", "axis")
        .each(function(d) {
          d3.select(this).call(self.axis.scale(self.y[d])); });
      
      // Set Axis Name
      labels.forEach(function(key){
        var textData = [];
        var subText = key.substr(0, self.labelLength);
        var index = 0;
        while(subText.length > 0){
          textData[index] = subText;
          index += 1;
          subText = key.substr(index*self.labelLength, self.labelLength);
        }
        var topHeight = -10 * textData.length;
        textData.forEach(function(d) {
          self.svg.selectAll("g.dimension#"+key)
            .selectAll("g.axis")
            .append("text").style("text-anchor", "middle")
            .attr("y", function(){
              return topHeight+15*textData.indexOf(d);})
            .text(d);
        });
      });
      // Add and store a brush for each axis.
      self.axisG.append("g")
        .attr("class", "brush")
        .each(function(d) {
          d3.select(this).call(
            self.y[d].brush =
              d3.svg.brush().y(self.y[d])
              .on("brushstart", brushstart)
              .on("brush", brush));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
    }
    // Returns the path for a given data point.
    function path(d) {
      return self.line(self.dimensions.map(function(p) {
        return [position(p), self.y[p](d[p])]; }));
    }
    function position(d) {
      var v = self.dragging[d];
      return v === undefined ? self.x(d) : v;
    }
    function transition(g) {
      return g.transition().duration(500);
    }
    function brushstart() {
        d3.event.sourceEvent.stopPropagation();
    }
    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
      var active_keys = [];
      var actives = self.dimensions.filter(function(p) { return !self.y[p].brush.empty(); });
      var extents = actives.map(function(p) { return self.y[p].brush.extent(); });
      self.foreground.style("display", function(d) {
        if(actives.every(function(p, i) {
          return extents[i][0] <= d[p] && d[p] <= extents[i][1];
        })){
          active_keys.push(d);
          return null;
        }else{
          return "none";
        }
      });
    }

    var dataTypes = self.io.dataManager().getDataType();
    // Update Labels for String-Axis
    self.io.dataManager().getMapperProps("axiscolumns").map2
    .filter(function(elem){
       return dataTypes[elem]!== 'number';
    })
    .forEach(function(elem){
      self.svg.select("g.dimension#" + elem)
        .selectAll("g.tick")
        .selectAll("text")
        .text(function(d){
          if(self.columnsStringValue2Label[elem][d] !== undefined){
            return self.columnsStringValue2Label[elem][d];
          }
          return "";
        });
    });
  };
 /**
  * refresh brush area
  * @method refresh
  * @memberOf ParallelCoordinates
  **/
  ParallelCoordinates.prototype.refresh = function(){
    var self = this;
    var actives = self.dimensions.filter(function(p) { return !self.y[p].brush.empty(); });
    if(actives.length > 0){
      actives.forEach(function(d){
        self.y[d].brush.clear();
      });
    }
    actives = self.dimensions.filter(function(p) {
      return !self.y[p].brush.empty();
    });
    // Refresh Rect Extent
    d3.selectAll("rect.extent").attr("height","0");
    // Make Output Info.
    var active_keys = [];
    self.foreground.style("display", function(d) {
      active_keys.push(d.label);
    });
  };
  ParallelCoordinates.prototype.getSelectedLegends = function () {
    var self = this;
    var selectedLegends = [];
    if(self.io.isHighlightMode()) {
      self.io.dataManager().getMapperProps("axiscolumns").map2.forEach(function(elem){
        selectedLegends.push(elem);
      });
    }else {
      self.io.dataManager().getMapperProps("axiscolumns").map2.forEach(function(elem){
        selectedLegends.push(elem);
      });
    }
    return selectedLegends;
  };
 /**
   * mode Selector by user
   * @method mode
   * @memberOf ParallelCoordinates
   */
  ParallelCoordinates.prototype.mode = function (mode) {
    if(mode){
      this._mode = mode;
      this.redraw();
    }
    return this._mode;
  };
  return ParallelCoordinates;
});
