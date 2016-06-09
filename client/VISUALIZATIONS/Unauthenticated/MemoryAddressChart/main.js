/**
 * @fileOverview implement for MemoryAddressChart
 * @author ThongKN - modifier
 * @version 1.2
 * @copyright TSDV
 */

/**
 * Initial config additional library files for this chart
 */

/**
 * Create MemoryAddressChart main function
 * @class MemoryAddressChart
 * @param {type} AxisSelectable AxisSelectable class
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {MemoryAddressChart}
 */
define(["util/AxisSelectable", "util/tooltip/OldTooltip", "css!./MemoryAddressChart"], function (AxisSelectable, CustomTooltip) {
  /**
   * Constructor
   * @class MemoryAddressChart
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {MemoryAddressChart}
   */
  var MemoryAddressChart = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.setValue({
      selection: [],
      changeColor: {label: "", color: "#FFFFFF"},
      timeRangeX: [0, 0],
      timeRangeY: [0, 0]
    });
  };

  /**
   * update chart according with changed of interface variables
   * @method MemoryAddressChart
   * @memberOf MemoryAddressChart
   * @returns {MemoryAddressChart}
   */
  MemoryAddressChart.prototype.update = function (changedAttr) {
    var self = this;

    // if selection changed
    if (changedAttr.hasOwnProperty("selection")) {
      self.isDrawAxisSelectable = false;
      self.deleteExistingElements();
      resetAxesValue({
        chart  : self,
        fixMinX: self.fixMinX,
        fixMaxX: self.fixMaxX,
        fixMinY: self.fixMinY,
        fixMaxY: self.fixMaxY
      });
      self.createMemoryAddressChart();
    }
    // if color or timerange changed
    this.setColorAndTimeRange(self, changedAttr);
  };
  /**
   * reset value of X, Y axis after user change selection
   * @method resetAxesValue
   * @memberOf MemoryAddressChart
   * @private
   */
  function resetAxesValue(val) {
    // reset value of X axis
    val.chart.minX = val.fixMinX;
    val.chart.maxX = val.fixMaxX;
    // reset value of Y axis
    val.chart.minY = val.fixMinY;
    val.chart.maxY = val.fixMaxY;
  };
  /**
   * set color for changed color line and rescale chart according with timeRangeX and Y
   * @method setColorAndTimeRange
   * @memberOf MemoryAddressChart
   * @private
   */
  MemoryAddressChart.prototype.setColorAndTimeRange = function(chart, changedAttr) {
    // if timeRangeX changed
    if (changedAttr.hasOwnProperty("timeRangeX")) {
      var b = [changedAttr.timeRangeX[0], changedAttr.timeRangeX[1]];
      chart.scaleXAxis(b);
      
    }
    // if timeRangeY changed
    if (changedAttr.hasOwnProperty("timeRangeY")) {
      chart.scaleYAxis([changedAttr.timeRangeY[0], changedAttr.timeRangeY[1]]);
    }
    // if changeColor changed
    if (changedAttr.hasOwnProperty("changeColor")) {
      // get id of changed color line
      var pathId = "memory_address_" + changedAttr.changeColor.label.replace(/ /g, "_");
      // change color for chart
      d3.selectAll('path#' + pathId).style('fill', changedAttr.changeColor.color);
      // change color for legend
      d3.select('rect#legend_' + pathId).style('fill', changedAttr.changeColor.color);
      // update color list
      chart.colors[changedAttr.changeColor.label] = changedAttr.changeColor.color;
    }
  };
  /**
   * render chart
   * @method render
   * @memberOf MemoryAddressChart
   */
  MemoryAddressChart.prototype.render = function ( containerWidth, containerHeight) {
    if (this.validate()) {
      // initialize
      this.initialize(containerWidth, containerHeight);
      // convert received data to understandable data format
      this.convertData(this.io.data);
      // create chart header
      this.createChartHeader();
      // create address chart
      this.createMemoryAddressChart();
      
      return this.svg_dom;
    }
    
    return null;
  };

  /**
   * This function will validate input data for drawing chart.
   * If data is validate, chart will be drawn.
   * @returns {Boolean}
   */
  MemoryAddressChart.prototype.validate = function () {
    var currentData = this.io.data;
    // check data empty or not
    if (currentData.length === 0) {
      return false;
    } else {
      var header = Object.keys(currentData[0]);
      for (var i = 0; i < currentData.length; i++) {
        var row = currentData[i];
        // Check valid data at here
        for (var j = 1; j < header.length; j++) {
          if (!$.isNumeric(row[header[j]])) {
            return false;
          }
        }
      }
    }
    return true;
  };

  

  /**
   * initialize
   * @method initialize
   * @memberOf MemoryAddressChart
   */
  MemoryAddressChart.prototype.initialize = function (containerWidth, containerHeight) {
    // Declare size and position
    this.margin = {top: 50, right: 100, bottom: 150, left: 150};
    // init chart width, height
    this.width = containerWidth;
    this.height = containerHeight;
    // init color
    this.color = d3.scale.category20();
    this.colors = {};
    // init for chart legend
    this.explainChartWidth = 30;
    this.explainChartHeight = 30;
    // Create tooltip
    this.tooltip = new CustomTooltip("tooltip", 240);
    // Compute some max or min of data
    this.minX = 0;
    this.maxX = 0;
    this.minY = 0;
    this.maxY = 0;
    // init chart data
    this.chartData = null;
    this.newData = [];
    this.selection = [];
    // Hold space drawing
    this.svg = null;
    this.isDrawAxisSelectable = true;
  }

  /**
   * convert data if need
   * @method convertData
   * @param {typeƯ rawData json string data.
   * @memberOf MemoryAddressChart
   */
  MemoryAddressChart.prototype.convertData = function (data) {
    var self = this;

    rawData = data;

    rawData.forEach(function (d, i) {
      var obj = {
        id: i,
        name: d.variable_name,
        startX: parseInt(d.start_cycle),
        endX: parseInt(d.end_cycle),
        startY: parseInt(d.start_address, 16),
        endY: parseInt(d.end_address, 16)
      };
      // get list of variable
      if (self.selection.indexOf(d.variable_name) < 0) {
        // push into list
        self.selection.push(d.variable_name);
        // set color
        self.colors[d.variable_name] = self.color(d.variable_name);
      }
      // set data
      self.newData.push(obj);
    });
    // parse data
    self.chartData = self.parseData(self.newData);

    // Compute some max or min of data for X axis
    self.minX = d3.min(self.newData, function (d) {
      return d.startX;
    });
    self.maxX = d3.max(self.newData, function (d) {
      return d.startX;
    });
    // save minX, maxX of X axis
    var fMinX = self.minX,
        fMaxX = self.maxX;
    self.fixMinX = fMinX;
    self.fixMaxX = fMaxX;
    // for Y axis
    self.minY = d3.min(self.newData, function (d) {
      return d.startY;
    });
    self.maxY = d3.max(self.newData, function (d) {
      return d.startY;
    });
    // save minY, maxY of Y axis
    var fMinY = self.minY,
        fMaxY = self.maxY;
    self.fixMinY = fMinY;
    self.fixMaxY = fMaxY;
    // set value after converted data for interface variables
    self.io.setValue('selection', self.selection);
    self.io.setValue('changeColor', {label: self.selection[0], color: self.colors[self.selection[0]]});
    self.io.setValue('timeRangeX', [self.minX, self.maxX]);
    self.io.setValue('timeRangeY', [self.minY, self.maxY]);
    // set scope for interface variables
    self.io.setDesigner('selection', {type: 'selection', range: self.selection});
    self.io.setDesigner('changeColor', {type: 'colorPicker', value: self.colors, range: self.selection});
    self.io.setDesigner('timeRangeX', {type: 'slider', value: [self.minX, self.maxX], range: [self.minX, self.maxX]});
    self.io.setDesigner('timeRangeY', {type: 'slider', value: [self.minY, self.maxY], range: [self.minY, self.maxY]});
  }

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf MemoryAddressChart
   */
  MemoryAddressChart.prototype.createChartHeader = function (containerElement) {
    var self = this;
    self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
    // create svg
    self.svg =  d3.select(self.svg_dom)
      .attr('class', 'memoryaddresschart')
      .attr("width", self.width)
      .attr("height", self.height);

    // Create area to clip path when zoom in, zoom out chart
    self.svg.append("defs").append("clipPath")
      .attr("id", "clipMAC")
      .append("rect")
      .attr("width", self.width)
      .attr("height", self.height);
  }

  /**
   * create Memory Address Chart
   * @memberOf MemoryAddressChart
   * @method createMemoryAddressChart
   */
  MemoryAddressChart.prototype.createMemoryAddressChart = function () {
    var self = this;
    // create Main chart
    self.createMemoryAddressMainChart();
    // draw Axis
    self.drawAxis();
    // draw Legend
    self.drawLegend();

    if (self.isDrawAxisSelectable) {
      // Create Seclectable Chart for x axis
      var selectX = new AxisSelectable({
        width: self.width,
        height: self.margin.bottom / 3,
        posX: self.margin.left,
        posY: self.margin.top + self.height + self.margin.bottom / 3,
        startX: self.minX,
        endX: self.maxX,
        startY: 0,
        endY: 0,
        axisOriented: "bottom",
        charts: [self],
        data: self.newData,
        svg: self.svg
      });

      // Create Selectable Chart for x axis
      var selectY = new AxisSelectable({
        width: self.margin.left / 3,
        height: self.height,
        posX: self.margin.left * 0.1,
        posY: self.margin.top,
        startX: 0,
        endX: 0,
        startY: self.minY,
        endY: self.maxY,
        axisOriented: "left",
        charts: [self],
        data: self.newData,
        svg: self.svg,
        format: "06x"
      });

      selectX.update({});
      selectY.update({});
      selectX.render();
      selectY.render();
    }
  }

  /**
   * create main chart of Memory Address Chart
   * @memberOf MemoryAddressChart
   * @method createMemoryAddressMainChart
   */
  MemoryAddressChart.prototype.createMemoryAddressMainChart = function () {
    var self = this,
      selection = [],
      selectedItems = self.io.getValue("selection"),
      changeColor = self.io.getValue("changeColor");

    selectedItems.forEach(function (d) {
      if (self.selection.indexOf(d) !== -1) {
        selection.push(d);
      }
    });

    // check selection
    if (selection.length > 0) {
      // Create range and domain scale for x axis
      self.xScale = d3.scale.linear()
        .range([0, self.width])
        .domain([self.minX, self.maxX]);

      // Create range and domain scale for y axis
      self.yScale = d3.scale.linear()
        .range([self.height, 0])
        .domain([self.minY, self.maxY]);

      // Create local xScale, yScale
      var xS = self.xScale,
        yS = self.yScale;

      // Create line to draw on chart
      self.line = d3.svg.line()
        .interpolate("linear-closed")
        .x(function (d) {
          return xS(d.x);
        })
        .y(function (d) {
          return yS(d.y);
        });

      // Create space to draw chart
      self.mainChart = self.svg.append("g")
        .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

      self.mainChartPath = self.mainChart.append("g");

      // Map data to display chart
      self.chartData.forEach(function (d) {
        if (selection.indexOf(d.name) >= 0) {
          self.mainChartPath.append("path")
            .datum(d.data)
            .attr("id", "memory_address_" + d.name)
            .attr("class", "line")
            .attr("clip-path", "url(#clipMAC)")
            // Add attribute of this path, it is a line and define in line variable
            .attr("d", self.line)
            // Fill color for this path
            .style("fill", function () {
              return (changeColor.label === d.name) ? changeColor.color : self.colors[d.name];
            })
            // Set width stroke of this path
            .style("stroke-width", 0)
            // Show tooltip when move mouse over this path
            .on("mouseover", function () {
              return self.showTooltips(d, this);
            })
            // Hide tooltip when move mouse over this path
            .on("mouseout", function (d, i) {
              return self.hideTooltips();
            });
        }
      });

      // create scale for X axis after select in Selectable X axis
      self.scaleXAxis = function (b) {
        if (self.resample === true) {
          self.minX = b[0];
          self.maxX = b[1];
          self.xScale.domain(b);
          self.io.setValue({"timeRangeX": b});
          self.mainChart.select(".x.axis").call(self.xAxis);
          // execute resampling
          self.resampling();
        }
        else {
          self.xScale.domain(b);
          self.io.setValue({"timeRangeX": b});
          self.mainChart.selectAll(".line").attr("d", self.line);
          self.mainChart.select(".x.axis").call(self.xAxis);
        }
      };

      // create scale for Y axis after select in Selectable Y axis
      self.scaleYAxis = function (b) {
        if (self.resample === true) {
          self.minY = b[0];
          self.maxY = b[1];
          self.yScale.domain(b);
          self.mainChart.select(".y.axis").call(self.yAxis);
          // execute resampling
          self.resampling();
        } else {
          self.yScale.domain(b);
          self.mainChart.selectAll(".line").attr("d", self.line);
          self.mainChart.select(".y.axis").call(self.yAxis);
        }
      };
    }
  }

  /**
   * create X, Y axis of Memory Address Chart
   * @memberOf MemoryAddressChart
   * @method drawAxis
   */
  MemoryAddressChart.prototype.drawAxis = function () {
    var self = this;
    // Create x axis
    self.xAxis = d3.svg.axis().scale(self.xScale).orient("bottom");

    // Show x axis to chart
    self.mainChart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + self.height + ")")
      .call(self.xAxis)
      .append("text")
      .attr("class", "x-label")
      .attr("transform", "translate(" + self.width + ", 15)")
      .text("Execution cycle")
      .attr('x', 20)
      .attr('y', 1);

    // Create y axis
    self.yAxis = d3.svg.axis()
      .scale(self.yScale)
      .orient("left")
      .tickFormat(function (d) {
        return self.decimalToHex(d, 6);
      });

    // Show y axis to chart
    self.mainChart.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(0,0)")
      .call(self.yAxis)
      .append("text")
      .attr("class", "y-label")
      .attr("transform", "translate(-40, -20)")
      .text("Memory address");
  }
  /**
   * create legend of Memory Address Chart
   * @memberOf MemoryAddressChart
   * @method drawLegend
   */
  MemoryAddressChart.prototype.drawLegend = function () {
    var self = this,
      selection = [],
      selectedItems = self.io.getValue("selection"),
      changeColor = self.io.getValue("changeColor");

    selectedItems.forEach(function (d) {
      if (self.selection.indexOf(d) !== -1) {
        selection.push(d);
      }
    });

    if (selection.length > 0) {
      // Add Explain Chart to svg tag
      self.chartLegend = self.svg.append("g")
        .attr("transform", "translate(" + (self.width + self.margin.left) + "," + self.margin.top + ")");

      // Draw each rectange with correlative color
      selection.forEach(function (d, i) {
        // Create local label that own function
        var label = d;

        // Draw rectange
        self.chartLegend.append("rect")
          .attr("id", "legend_memory_address_" + label)
          .attr("class", "rect_legend")
          .attr("x", 0)
          .attr("y", i * self.explainChartHeight)
          .attr("width", self.explainChartWidth)
          .attr("height", self.explainChartHeight)
          .style("fill", function () {
            return (changeColor.label === label) ? changeColor.color : self.colors[label];
          });

        // Draw text
        self.chartLegend.append("text")
          .attr("class", "label-name")
          .attr("x", self.explainChartWidth * 1.2)
          .attr("y", i * self.explainChartHeight + self.explainChartHeight / 2)
          .text(label);
      });
    }
  }

  /**
   * Show tooltips
   * @param {type} iChartData
   * @param {type} element
   */
  MemoryAddressChart.prototype.showTooltips = function (iChartData, element) {
    var self = this,
      content = "<span class=\"name\">Variable Name : </span><span class=\"value\"> " + iChartData.name + "</span><br/>";

    d3.select(element).attr("stroke", "black");

    content += "<span class=\"name\">Start Cycle : </span><span class=\"value\"> " + iChartData.data[0].x + "</span><br/>";
    content += "<span class=\"name\">End Cycle : </span><span class=\"value\"> " + iChartData.data[2].x + "</span><br/>";
    content += "<span class=\"name\">Start Address : </span><span class=\"value\"> " + self.decimalToHex(iChartData.data[0].y, 6) + "</span><br/>";
    content += "<span class=\"name\">End Address : </span><span class=\"value\"> " + self.decimalToHex(iChartData.data[2].y, 6) + "</span><br/>";

    return self.tooltip.showTooltip(content, d3.event);
  };

  /**
   * Hide tooltips
   */
  MemoryAddressChart.prototype.hideTooltips = function () {
    var self = this;
    return self.tooltip.hideTooltip();
  };

  /**
   * Resampling for chart
   */
  MemoryAddressChart.prototype.resampling = function () {
    var self = this,
      selection = self.io.getValue("selection"),
      changeColor = self.io.getValue("changeColor"),
      filteredData = self.newData.filter(function (d) {
        if (d.startX > self.minX &&
          d.endX < self.maxX &&
          d.startY > self.minY &&
          d.endY < self.maxY) {
          return d;
        }
      });

    self.mainChartPath.remove();
    self.chartData = self.parseData(filteredData);

    self.mainChartPath = self.mainChart.append("g");
    // Map data to display chart
    self.chartData.forEach(function (d) {
      if (selection.indexOf(d.name) >= 0) {
        self.mainChartPath.append("path")
          .datum(d.data)
          .attr("id", "memory_address_" + d.name)
          .attr("class", "line")
          .attr("clip-path", "url(#clipMAC)")
          // Add attribute of this path, it is a line and define in line variable
          .attr("d", self.line)
          // Fill color for this path
          .style("fill", function () {
            return (changeColor.label === d.name) ? changeColor.color : self.colors[d.name];
          })
          // Set width stroke of this path
          .style("stroke-width", 0)
          // Show tooltip when move mouse over this path
          .on("mouseover", function () {
            return self.showTooltips(d, this);
          })
          // Hide tooltip when move mouse over this path
          .on("mouseout", function (d, i) {
            return self.hideTooltips();
          });
      }
    });
  }

  /**
   * remove currend svg and reset data to draw other type of chart
   * @method params
   * @memberOf MemoryAddressChart
   */
  MemoryAddressChart.prototype.deleteExistingElements = function () {
    var self = this;
    // delete existing elements of svg before redraw
    self.mainChart.remove();
    self.chartLegend.remove();
    // reset svg
    self.mainChart = self.svg.append("g")
      .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
    self.chartLegend = self.svg.append("g")
      .attr("transform", "translate(" + (self.width + self.margin.left) + "," + self.margin.top + ")");
  }

  /**
   * Convert decimal to hex
   * @param {type} d
   * @param {type} padding
   * @returns {String} : String Hex
   */
  MemoryAddressChart.prototype.decimalToHex = function (d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
      hex = "0" + hex;
    }
    return "0x" + hex;
  }

  /**
   * parse data function
   * @method parseData
   * @memberOf MemoryAddressChart
   * @param {type} data
   * @returns {Array}
   */
  MemoryAddressChart.prototype.parseData = function (data) {
    var parsedData = [];
    // Convert each data
    data.forEach(function (d) {
      // Define new object to push into array
      var obj = {
        id: d.id,
        name: d.name,
        data: []
      };
      // Push value to data of obj
      obj.data.push({x: d.startX, y: d.startY});
      obj.data.push({x: d.endX, y: d.startY});
      obj.data.push({x: d.endX, y: d.endY});
      obj.data.push({x: d.startX, y: d.endY});
      // Push obj to array
      parsedData.push(obj);
    });

    return parsedData;
  }

  return MemoryAddressChart;
});
