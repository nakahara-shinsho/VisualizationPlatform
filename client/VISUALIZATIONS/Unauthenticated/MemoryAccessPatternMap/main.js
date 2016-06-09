/**
 * @fileOverview implement for MemoryAccessPatternMap
 * @author ThongKN
 * @version 1.3
 * @copyright TSDV
 */

/**
 * Initial config additional library files for this chart
 */
require.config({
  enforceDefine: false,
  paths: {
    "AxisSelectable": "common/AxisSelectable"
  },
  shim: {
    "AxisSelectable": {
      exports: "AxisSelectable"
    }
  }
});

/**
 * Create MemoryAccessPatternMap main function
 * @class MemoryAccessPatternMap
 * @param {type} AxisSelectable AxisSelectable class
 * @param {type} Fisheye Fisheye class
 * @returns {MemoryAccessPatternMap} MemoryAccessPatternMap
 */
define(["util/AxisSelectable", "./fisheye", 'css!./MemoryAccessPatternMap'], function (AxisSelectable, Fisheye) {
  /**
   * Constructor create MemoryAccessPatternMap
   * @class MemoryAccessPatternMap
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {MemoryAccessPatternMap}
   */
  var MemoryAccessPatternMap = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.setValue({
      magnifying: true,
      timeRangeX: [0, 0],
      timeRangeY: [0, 0]
    });
  };

  /**
   * update chart according with changed of interface variables
   * @method MemoryAccessPatternMap
   * @memberOf MemoryAccessPatternMap
   * @returns {MemoryAccessPatternMap}
   */
  MemoryAccessPatternMap.prototype.update = function (changedAttr) {
    var self = this;

    // if timeRangeX changed
    if (changedAttr.hasOwnProperty("timeRangeX")) {
      self.scaleXAxis([changedAttr.timeRangeX[0], changedAttr.timeRangeX[1]]);
    }
    // if timeRangeY changed
    if (changedAttr.hasOwnProperty("timeRangeY")) {
      self.scaleYAxis([changedAttr.timeRangeY[0], changedAttr.timeRangeY[1]]);
    }

    // if magnifying changed
    if (changedAttr.hasOwnProperty("magnifying")) {
      // create fisheye
      if (changedAttr.magnifying === true) {
        self.createFisheye();
      }
      // remove fisheye and redraw chart
      else {
        this.deleteExistingElements();
        this.createMap();
      }
    }
  }

  /**
   * This function will validate input data for drawing chart.
   * If data is validate, chart will be drawn.
   * @returns {Boolean}
   */
  MemoryAccessPatternMap.prototype.validate = function () {
    var isValidate = true;
    var currentData = this.io.data;
    // check data empty or not
    if (currentData.length === 0) {
      isValidate = false;
    }
    // if not empty
    else {
      var header = Object.keys(currentData[0]);
      for (var i = 0; i < currentData.length; i++) {
        var row = currentData[i];
        for (var j = 0; j < header.length; j++) {
          if (!$.isNumeric(row[header[j]])) {
            isValidate = false;
            break;
          }
        }
        if (isValidate === false) {
          break;
        }
      }
    }

    return isValidate;
  },
    /**
     * render Memory Access Pattern Map
     * @method render
     * @memberOf MemoryAccessPatternMap
     */
    MemoryAccessPatternMap.prototype.render = function ( containerWidth, containerHeight) {
      // validate data
      var isOk = this.validate();
      if (isOk) {
        // initialize
        this.initialize(containerWidth, containerHeight);
        // convert data
        this.convertData(this.io.data);
        // create chart header
        this.createChartHeader();
        // create axis selectable
        this.createAxisSelectable();
        // create memory access pattern map
        this.createMap();
        return this.svg_dom;
      }
      else {
        alert('Memory Access Pattern Map Data error!');
        return null;
      }
    }

  /**
   * initialize
   * @method initialize
   * @memberOf MemoryAccessPatternMap
   */
  MemoryAccessPatternMap.prototype.initialize = function (containerWidth, containerHeight) {
    // define width and height of drawing area
    // set width, height
    this.width = containerWidth;
    this.height = containerHeight;
    // set margin
    this.margin = {top: 50, right: 100, bottom: 120, left: 70};
    // set default value for using magnifying
    this.magnify = true;
    // value used to set position of chart, X axis, Y axis
    this.space = 10;
    // set color
    this.color = d3.scale.quantize().range([
      "#d9ef8b", "#a6d96a", "#66bd63", "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"]);
    // init data array of chart
    this.totalAddress = [];
    this.maxCycle = 0;
    this.maxFrequency = 0;
    this.chartData = null;
    this.svg = null;
    this.dataError = false;
  }

  /**
   * Convert received data to understandable data format for self chart: treeData
   * @method convertData
   * @memberOf MemoryAccessPatternMap
   */
  MemoryAccessPatternMap.prototype.convertData = function (data) {
    var self = this,
      standardData = [],
      rawData = data;

    rawData.forEach(function (d) {
      var obj = {
        'address': d.address,
        'start': Number(d.start_cycle),
        'end': Number(d.end_cycle),
        'frequency': Number(d.access_frequency)
      };
      standardData.push(obj);
    });

    // get array of address, max frequency, max cycle from input data
    standardData.forEach(function (d) {
      // get address array
      if (self.totalAddress.indexOf(d.address) === -1) {
        self.totalAddress.push(d.address);
      }

      // get max frequency value
      if (d.frequency > self.maxFrequency) {
        self.maxFrequency = d.frequency;
      }

      // get max cycle value (from end cycle value: cycleData[1].cycle)
      if (Number(d.end) > Number(self.maxCycle)) {
        self.maxCycle = d.end;
      }
    });

    // get data to draw chart
    self.chartData = self.parseData(standardData);

    // set value after converted data for interface variables
    self.io.setValue('magnifying', false);
    self.io.setValue('timeRangeX', [0, self.maxCycle]);
    self.io.setValue('timeRangeY', [self.totalAddress[0], self.totalAddress[self.totalAddress.length - 1]]);
    // set scope for interface variables
    self.io.setDesigner('magnifying', {type: 'checkbox', name: 'Magnify mode'});
    self.io.setDesigner('timeRangeX', {type: 'slider', range: [0, self.maxCycle], value: [0, self.maxCycle]});
    self.io.setDesigner('timeRangeY', {type: 'slider', range: [0, self.height], value: [0, self.height]});
  }

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf MemoryAccessPatternMap
   */
  MemoryAccessPatternMap.prototype.createChartHeader = function (containerElement) {
    var self = this;
    self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
    // create svg
    self.svg =  d3.select(self.svg_dom)
      .attr('class', 'memoryaccesspatternmap')
      .attr("width", self.width)
      .attr("height", self.height)
    .append("g")
      .attr("transform", "translate(" + self.margin.left + ", 0)");

    // append clipPath
    self.svg.append("defs").append("clipPath")
      .attr("id", "clipMemoryAccessPatternMap")
      .append("rect")
      .attr("width", self.width - self.margin.right)
      .attr("height", self.height - self.margin.bottom);
  }

  /**
   * create selectable for X, Y axis
   * @method createAxisSelectable
   * @memberOf MemoryAccessPatternMap
   */
  MemoryAccessPatternMap.prototype.createAxisSelectable = function () {
    var self = this;
    // create selectable chart on X axis
    self.selectX = new AxisSelectable({
      width: self.width - self.margin.right,
      height: self.space * 3,
      posX: self.margin.left + self.space * 8,
      posY: self.margin.top + (self.height - self.margin.bottom) + self.space * 3,
      startX: 0,
      endX: self.maxCycle,
      startY: 0,
      endY: 0,
      axisOriented: "bottom",
      charts: [self],
      data: self.chartData,
      svg: self.svg
    });

    // create selectable chart on Y axis
    self.selectY = new AxisSelectable({
      width: self.space * 4,
      height: self.height - self.margin.bottom,
      posX: self.margin.left - self.space * 4,
      posY: self.margin.top,
      startX: 0,
      endX: 0,
      startY: 0,
      endY: self.height,
      format: "04x",
      axisOriented: "left",
      charts: [self],
      data: self.chartData,
      svg: self.svg
    });

    self.selectX.update({});
    self.selectY.update({});
  }

  /**
   * create memory access pattern map
   * @method createMap
   * @memberOf MemoryAccessPatternMap
   */
  MemoryAccessPatternMap.prototype.createMap = function () {
    var self = this,
      magnify = self.io.getValue("magnifying"),
      chartData = self.chartData,
      totalAddress = self.totalAddress,
      fillColor = self.color,
      filteredData = [],
      arr = [],
      h_position = 0,
      rectHeight = (self.height / self.totalAddress.length),
      formatter = d3.format(".3f");

    // xScale
    self.xScale = d3.scale.linear()
      .range([0, self.width - self.margin.right])
      .domain([0, self.maxCycle]);
    // yScale
    self.yScale = d3.scale.linear()
      .range([self.height - self.margin.bottom, 0])
      .domain([0, self.height]);

    // init local cordinates scale
    var xS = self.xScale;
    var yS = self.yScale;

    // use to save brush's domain for Xaxis in the case scaled before using maginifying glass effect
    self.brushXDomain = null;
    // use to save brush's domain for Yaxis in the case scaled before using maginifying glass effect
    self.brushYDomain = null;

    self.scaleYAxis = function (b) {
      self.brushYDomain = b;
      self.yScale.domain(b);
      self.chartContainer.selectAll(".value").attr("d", self.line);
      self.chartContainer.select(".y.axis").call(self.yAxis);
    };

    self.scaleXAxis = function (b) {
      self.brushXDomain = b;
      self.xScale.domain(b);
      self.chartContainer.selectAll(".value").attr("d", self.line);
      self.chartContainer.select(".x.axis").call(self.xAxis);
    };

    // set domain for color
    fillColor.domain([0, self.maxFrequency]);

    // create chartContainer
    self.chartContainer = self.svg.append("g")
      .attr("transform", "translate(" + (self.margin.left + 80) + "," + self.margin.top + ")");

    // Create line to draw on chart
    self.line = d3.svg.line()
      .interpolate("linear-closed")
      .x(function (d) {
        return xS(d[0]);
      })
      .y(function (d) {
        return yS(d[1]);
      });

    self.pathContainer = self.chartContainer.append("g");

    // draw path with each memory address
    totalAddress.forEach(function (eachAddress) {
      // filter chartData to get data of each address
      filteredData = chartData.filter(function (d) {
        return eachAddress === d.address;
      });

      // set horizontal position for each Address
      h_position = 0;
      h_position = rectHeight * totalAddress.indexOf(eachAddress);

      // get Y axis tick value
      arr.push((h_position + rectHeight / 2));

      // draw path with specified address in filteredData
      filteredData.forEach(function (eachFilter) {
        self.pathContainer.append("path")
          .datum(eachFilter.mapData)
          .attr("class", "value")
          .attr("clip-path", "url(#clipMemoryAccessPatternMap)")
          .attr("d", self.line)
          // set color for path
          // in the case frequency is Zero then "white" color will be filled
          .style("fill", function (d) {
            return (eachFilter.frequency === 0) ? "white" : fillColor(Number(eachFilter.frequency));
          })
          .style("stroke-width", 0)
          .style("opacity", "0.95")
          .on("mousedown", function () {
            d3.event.stopPropagation();
          });
      });
    });

    // create Magnifying effect
    if (magnify === true) {
      self.createFisheye();
    }
    else {
      // disable Magnifying effect
      self.pathContainer.on("mousemove", function () {
      });
    }

    // draw axis
    self.drawAxis(arr, h_position, rectHeight);
    // draw legend
    self.drawLegend(fillColor, formatter);
    // render axis selectable
    self.selectX.render();
    self.selectY.render();
  }

  /**
   * draw X, Y axis for chart
   * @method drawAxis
   * @memberOf MemoryAccessPatternMap
   */
  MemoryAccessPatternMap.prototype.drawAxis = function (arr, h_position, rectHeight) {
    var self = this,
      // init local cordinates scale
      totalAddress = self.totalAddress,
      xS = self.xScale,
      yS = self.yScale;

    // add axis
    self.xAxis = d3.svg.axis().scale(xS).orient("bottom");
    self.yAxis = d3.svg.axis().scale(yS).orient("left")
      .tickValues(arr)
      .tickFormat(function (d) {
        return self.changeValueToAddress(d, arr, totalAddress);
      });

    // draw X axis
    self.chartContainer.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (h_position + rectHeight - self.margin.bottom + 1) + ")")
      .call(self.xAxis)
      // create "Timeline" label
      .append('text')
      .text('Timeline')
      .attr('x', self.width - self.margin.right + self.space * 2)
      .attr('y', rectHeight - 5);

    // draw Y axis
    // set clip-path for Y axis
    var clipY = self.chartContainer.append("defs")
      .append("clipPath")
      .attr('id', 'clip-y-axis')
      .append('rect')
      .attr('x', -self.margin.left)
      .attr('y', 0)
      .attr('height', self.height - self.margin.bottom)
      .attr('width', self.margin.left);

    // add Y axis
    self.chartContainer.append("g")
      .attr("class", "y axis")
      .attr('clip-path', 'url(#clip-y-axis)')
      .call(self.yAxis)
      // create "Address" label
      .append('text')
      .text('Address')
      .attr('transform', "rotate (-90, -60, 100)")
      .attr('x', -20)
      .attr('y', self.margin.left + 30);

    // append color palette label
    self.chartContainer.append("text")
      .attr("class", "label-name")
      .attr("x", self.width - self.margin.right + self.space)
      .attr("y", 0)
      .text("Frequency");
  }

  /**
   * draw legend for chart
   * @method drawLegend
   * @memberOf MemoryAccessPatternMap
   */
  MemoryAccessPatternMap.prototype.drawLegend = function (fillColor, formatter) {
    var self = this,
      c = (self.maxFrequency / 8),
      i = self.maxFrequency,
      j = 0;

    // add reference for color of frequency
    for (i; i >= 0; i -= (c + 0.0002)) {
      // append color rectangle
      self.chartContainer.append("rect")
        .attr("class", "rectColor")
        .attr("x", self.width - self.margin.right + self.space)
        .attr("y", self.space + j)
        .attr("width", self.space * 2)
        .attr("height", self.space)
        .style("fill", function () {
          return fillColor(i);
        });

      // append value label
      self.chartContainer.append("text")
        .attr("x", self.width - self.margin.right + self.space * 4)
        .attr("class", "label-name")
        .attr("y", j + self.space * 2)
        .text(formatter(i));

      if (i !== self.maxFrequency) {
        i += 0.0001;
      }

      // increase Y position counter
      j = j + self.space;
    }
  }

  /**
   * Create fisheye for magnifying
   * @method createFisheye
   * @memberOf MemoryAccessPatternMap
   */
  MemoryAccessPatternMap.prototype.createFisheye = function () {
    var self = this,
      initFisheye = false;

    self.pathContainer.on("mousemove", function () {
      // init fisheye
      if (initFisheye === false) {
        // if selectable axis is selected then use domain of brush extent
        // if selected Selectable Xaxis
        if (self.brushXDomain) {
          self.xScale = d3.fisheye.scale(d3.scale.linear)
            .range([0, self.width - self.margin.right])
            .domain(self.brushXDomain);
          // if selected Selectable Yaxis
          if (self.brushYDomain) {
            self.yScale = d3.fisheye.scale(d3.scale.linear)
              .range([self.height - self.margin.bottom, 0])
              .domain(self.brushYDomain);
          }
          else {
            self.yScale = d3.fisheye.scale(d3.scale.linear)
              .range([self.height - self.margin.bottom, 0])
              .domain([0, self.height - self.margin.bottom]);
          }
        }
        // if selected Selectable Yaxis only
        else if (self.brushYDomain) {
          self.yScale = d3.fisheye.scale(d3.scale.linear)
            .range([self.height - self.margin.bottom, 0])
            .domain(self.brushYDomain);

          self.xScale = d3.fisheye.scale(d3.scale.linear)
            .range([0, self.width - self.margin.right])
            .domain([0, self.maxCycle]);
        }
        // moveover Heatmap chart first then create fisheye for magnifying effect
        else {
          self.xScale = d3.fisheye.scale(d3.scale.linear)
            .range([0, self.width - self.margin.right])
            .domain([0, self.maxCycle]);
          self.yScale = d3.fisheye.scale(d3.scale.linear)
            .range([self.height - self.margin.bottom, 0])
            .domain([0, self.height - self.margin.bottom]);
        }

        initFisheye = true;
      }
      self.xAxis.ticks(Math.max(self.width / 200, 5));
      var mouse = d3.mouse(this),
        xScale = self.xScale.focus(mouse[0]),
        yScale = self.yScale.focus(mouse[1]);

      self.line.x(function (d) {
        return xScale(d[0]);
      })
        .y(function (d) {
          return yScale(d[1]);
        });
      self.pathContainer.selectAll("path").attr("d", self.line);
      self.chartContainer.select(".x.axis").call(self.xAxis.scale(xScale));
      self.chartContainer.select(".y.axis").call(self.yAxis.scale(yScale));
    });

    /**
     * Create grid line for magnifying
     * @method fishline
     * @memberOf MemoryAccessPatternMap
     * @private
     */
    function fishline(d) {
      return line(d.map(function (d) {
        d = fisheye({x: d[0], y: d[1]});
        return [d.x, d.y];
      }));
    }
  };

  /**
   * remove current svg and reset data to draw other type of chart
   * @method params
   * @memberOf MemoryAccessPatternMap
   */
  MemoryAccessPatternMap.prototype.deleteExistingElements = function () {
    var self = this;
    // delete existing elements of svg before redraw
    self.chartContainer.remove();
    // reset svg
    self.chartContainer = self.svg.append("g")
      .attr("transform", "translate(" + (self.margin.left + 80) + "," + self.margin.top + ")");
  }

  /**
   * Change input value to according address string
   * @param {type} value - value in array
   * @param {type} valuesArray - array of value which needed change
   * @param {type} addressArray - array of address
   * @returns {string} Address string which according with index of value in valuesArray
   */
  MemoryAccessPatternMap.prototype.changeValueToAddress = function (value, valuesArray, addressArray) {
    // get index of value in valuesArray
    var index = valuesArray.indexOf(value);

    // return address according with index value
    return addressArray[index];
  }

  /**
   * parse data function
   * @method parseData
   * @memberOf MemoryAccessPatternMap
   * @param {type} data
   * @returns {Array}
   */
  MemoryAccessPatternMap.prototype.parseData = function (data) {
    var self = this,
      chartData = [], // return data of chart
      startPoint = 0, // start point of each path in Y axis
      endPoint = 0, // end point of each path in Y axis
      stepValue = 0;  // value between start point and end point
    if (self.dataError === false) {
      // change points value according with real data
      stepValue = self.height / self.totalAddress.length;

      // perform each element of data.
      data.forEach(function (d) {
        // set start point
        startPoint = stepValue * self.totalAddress.indexOf(d.address);

        // set end point
        endPoint = startPoint + stepValue;

        // create data info for each path of chart
        var obj = {
          address: d.address,
          frequency: d.frequency,
          mapData: []
        };

        // add value to mapData
        obj.mapData.push([Number(d.start), startPoint]);
        obj.mapData.push([Number(d.end), startPoint]);
        obj.mapData.push([Number(d.end), endPoint]);
        obj.mapData.push([Number(d.start), endPoint]);

        // push to chartData
        chartData.push(obj);
      });
    } else {
      return [];
    }

    return chartData;
  };

  return MemoryAccessPatternMap;
});
