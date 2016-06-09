/**
 * @fileOverview implement for MemoryAccessFrequencyChart
 * @author HienBT - modifier
 * @version 1.0
 * @copyright TSDV
 */

/**modified by xinxiao li : 2015/2/13*
 - delete the local css file
 - delete the resize function
 - use 'io' object to interact with framework
 - use containerWidth, containerHeight in render function for drawing chart
 - set 'viewport' to the whole chart size
 */

define(["css!./MemoryAccessFrequency"], function () {
  /**
   * Constructor create MemoryAccessFrequencyChart
   * @class MemoryAccessFrequencyChart
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {MemoryAccessFrequencyChart}
   */
  var MemoryAccessFrequencyChart = function (io) {
    this.io = io;
  };

  /**
   * update chart according with changed of interface variables
   * @method MemoryAccessFrequencyChart
   * @memberOf MemoryAccessFrequencyChart
   * @returns {MemoryAccessFrequencyChart}
   */
  MemoryAccessFrequencyChart.prototype.update = function () {
  };

  /**
   * Validate input data after drawing chart
   *    If isValidate is true: Data is valid
   *    Else: Data is invalid
   * @returns {Boolean} isValidate
   */
  MemoryAccessFrequencyChart.prototype.validate = function () {
    var currentData = this.io.data;
    // check data empty or not
    if (currentData.length === 0) {
      return false;
    } else {
      var header = Object.keys(currentData[0]);
      for (var i = 0; i < currentData.length; i++) {
        var row = currentData[i];
        if (!$.isNumeric(row[header[0]])
          || !$.isNumeric(row[header[1]])
          || !$.isNumeric(row[header[2]])) {
          return false;
        }
      }
    }
    return true;
  };

  /**
   * render Memory Access Frequency Chart
   * @method render
   * @memberOf MemoryAccessFrequencyChart
   */
  MemoryAccessFrequencyChart.prototype.render = function (containerWidth, containerHeight) {
    if (this.validate()) {
      // initialize
      this.initialize(containerWidth, containerHeight);
      // convert data
      this.convertData(this.io.data);
      // create chart header
      this.createChartHeader();
      // create Memory Access Frequency Chart
      this.createFrequencyChart();
      return this.svg_dom;
    }
    return null;
  };

  

  /**
   * initialize
   * @method initialize
   * @memberOf MemoryAccessFrequencyChart
   */
  MemoryAccessFrequencyChart.prototype.initialize = function (containerWidth, containerHeight) {
    // define width and height of drawing area
    this.width = containerWidth;
    this.height = containerHeight;
    this.margin = {top: 20, right: 10, bottom: 100, left: 40};
    this.contextHeight = this.chartHeight - this.margin.top - this.margin.bottom;
    // Scales. Note the inverted domain for the y-scale: bigger is up!
    this.x = d3.scale.linear().range([0, this.width]);
    this.y = d3.scale.linear().range([this.height, 0]);
    this.xAxis = d3.svg.axis().scale(this.x).orient("bottom").tickSize(-this.height, 0).tickPadding(6);
    this.yAxis = d3.svg.axis().scale(this.y).orient("right").tickSize(-this.width).tickPadding(6);
    // init others
    this.svg = null;
    this.area = null;
    this.line = null;
    this.rect = null;
    this.gradient = null;
    this.memoryData = null;
  }

  /**
   * convert data if need
   * @method convertData
   * @memberOf MemoryAccessFrequencyChart
   */
  MemoryAccessFrequencyChart.prototype.convertData = function (data) {
    // Convert received data to understandable data format
    this.memoryData = data;
  }

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf MemoryAccessFrequencyChart
   */
  MemoryAccessFrequencyChart.prototype.createChartHeader = function () {
    var self = this;
      x = self.x,
      y = self.y;

    // An area generator.
    self.area = d3.svg.area()
      .interpolate("step-after")
      .x(function (d) {
        return x(Number(d.cycle));
      })
      .y0(self.y(0))
      .y1(function (d) {
        return y(d.countPerCycle);
      });

    // A line generator.
    self.line = d3.svg.line()
      .interpolate("step-after")
      .x(function (d) {
        return x(Number(d.cycle));
      })
      .y(function (d) {
        return y(d.countPerCycle);
      });

    //self.svg = container.append("text").attr("id", "header").text("Memory Access");
    self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
    // create svg
    self.svg =  d3.select(self.svg_dom)
      .attr('class', 'memoryaccessfrequency')
      .attr("id", "memory_access_frequency")
      .attr("width", self.width)
      .attr("height", self.height)
      .attr("viewBox", '0, 0, ' + self.width + ', ' + self.height)
      .attr("preserveAspectRatio", 'none')
      .append("g").attr("transform", "translate(" + self.margin.left + ", 10)");

    self.gradient = self.svg.append("svg:defs")
      .append("svg:linearGradient")
      .attr("id", "gradient")
      .attr("x2", "0%")
      .attr("y2", "100%");

    self.gradient.append("svg:stop")
      .attr("offset", "50%")
      .attr("stop-color", "#0000ff")//0000FF
      .attr("stop-opacity", 0.75);

    self.gradient.append("svg:stop")
      .attr("offset", "75%")
      .attr("stop-color", "#0099ff")//66FFFF
      .attr("stop-opacity", 0.75);

    self.gradient.append("svg:stop")
      .attr("offset", "100%")
      .attr("stop-color", "#00ff00") //00FF00
      .attr("stop-opacity", 0.75);

    self.svg.append("svg:clipPath")
      .attr("id", "clipMAF")
      .append("svg:rect")
      .attr("x", x(0))
      .attr("y", y(1))
      .attr("width", x(1) - x(0))
      .attr("height", y(0) - y(1));
  }

  /**
   * create memory access frequency chart
   * @method createFrequencyChart
   * @memberOf MemoryAccessFrequencyChart
   */
  MemoryAccessFrequencyChart.prototype.createFrequencyChart = function () {
    var self = this,
      data = self.memoryData,
      svg = self.svg,
      xAxis = self.xAxis,
      yAxis = self.yAxis,
      area = self.area,
      line = self.line;

    // Parse dates and numbers.
    data.forEach(function (d) {
      if (d.countPerCycle > 0) {
        d.countPerCycle = +d.countPerCycle;
      }
    });

    // Compute the maximum
    self.x.domain([d3.min(data, function (d) {
        return Number(d.cycle);
      }), d3.max(data, function (d) {
        return Number(d.cycle);
      })]);
    self.y.domain([0, d3.max(data, function (d) {
        return d.countPerCycle;
      })]);

    //This copy of x captures the original domain setup
    self.x0 = self.x.copy();

    // append Y axis to svg
    svg.append("svg:g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + self.width + ",0)")
      .append("text")
      .attr("transform", "rotate(90)")
      .attr("x", 0)
      .attr("y", -70)
      .attr("dy", ".71em")
      .style("text-anchor", "start")
      .text("Accesses / Cycles");

    // append X axis to svg
    svg.append("svg:g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + self.height + ")")
      .append("text")
      .attr("x", self.width / 2)
      .attr("y", 20)
      .attr("dy", ".71em")
      .style("text-anchor", "start")
      .text(" Cycle");

    // append Rect to svg (use in zoom)
    self.rect = self.svg.append("svg:rect")
      .attr("class", "pane")
      .attr("width", self.width)
      .attr("height", self.height).attr("fill", "#DDDDDD");

    // append Path to svg
    svg.append("svg:path")
      .attr("class", "area")
      .attr("clip-path", "url(#clipMAF)")
      .style("fill", "url(#gradient)");

    // Bind the data to our path elements.
    svg.select("path.area").data([data]);
    svg.select("path.line").data([data]);

    var zoomLimit = d3.behavior.zoom()
      .x(self.x)
      .scaleExtent([d3.min(data, function (d) {
          return Number(d.cycle);
        }), d3.max(data, function (d) {
          return Number(d.cycle);
        })])
      .on("zoom", $.proxy(zoom, self));

    // Draw the zoomable elements
    zoom();

    self.rect.call(zoomLimit).on("mousedown", function () {
      d3.event.stopPropagation();
    });

    /**
     * zoom chart by move mouse wheel
     * @method zoom
     * @memberOf VariableLifetimeChart
     * @private
     */
    function zoom() {
      // store scale after zooming
      var previousScale = zoomLimit.scale(),
        // count width of graph after zooming
        gW = self.width * previousScale,
        // get max cycle
        max = d3.max($.map(data, function (d) {
          return Number(d.cycle);
        }));

      // check if move grapth to left out of range
      if (self.x.domain()[0] < self.x0.domain()[0]) {
        // move to start of graph
        zoomLimit.translate([0, 0]);
      }
      else if (self.x.domain()[1] > self.x0.domain()[1]) {
        // check if move grapth to right out of range
        // move to end of graph
        zoomLimit.translate([-(gW - self.width), 0]);
      }

      // select graph to zoom
      svg.select("g.x.axis").call(xAxis);
      svg.select("g.y.axis").call(yAxis);
      svg.select("path.area").attr("d", area);
      svg.select("path.line").attr("d", line);
    }
  }

  return MemoryAccessFrequencyChart;
});
