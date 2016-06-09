/**
 * @fileOverview Initial config additional library files implement for VariableLifetimeChart
 * @author ThongKN - modifier
 * @version 1.2
 * @copyright TSDV
 */

// variable use to hold charts for move chart action
var globalChartsVLCV = [];

/**
 * Create VariableLifetimeChart main function
 * @class VariableLifetimeChart
 * @param {type} LifetimeChartElement LifetimeChartElement class
 * @param {type} AxisSelectable AxisSelectable class
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {VariableLifetimeChart}
 */
define(["./LifetimeChartElement", "util/AxisSelectable", "util/tooltip/OldTooltip", 'css!./VariableLifetimeChart'], function (LifetimeChartElement, AxisSelectable, CustomTooltip) {
  /**
   * Constructor
   * @class VariableLifetimeChart
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {VariableLifetimeChart}
   */
  var VariableLifetimeChart = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.setValue({
      timeRangeX: [0, 0],
      selection: []
    });
  };

  /**
   * update chart according with changed of interface variables
   * @method VariableLifetimeChart
   * @memberOf VariableLifetimeChart
   * @returns {VariableLifetimeChart}
   */
  VariableLifetimeChart.prototype.update = function (changedAttr) {
    var self = this;
    // if timeRangeX changed
    if (changedAttr.hasOwnProperty("timeRangeX")) {
      self.charts.forEach(function (d) {
        d.scaleXAxis([changedAttr.timeRangeX[0], changedAttr.timeRangeX[1]]);
      });
    } else if (changedAttr.hasOwnProperty("selection")) {
      var gEl = $('svg.variablelifetimechart>g');
      gEl.html('');
      self.createAxisSelectable();
      self.createLifetimeChart();
    }
  };

  /**
   * This function will validate input data for drawing chart.
   * If data is validate, chart will be drawn.
   * @returns {Boolean}
   */
  VariableLifetimeChart.prototype.validate = function () {
    var currentData = this.io.data;
    // check data empty or not
    if (currentData.length === 0) {
      return false;
    } else {
      var header = Object.keys(currentData[0]);
      for (var i = 0; i < currentData.length; i++) {
        var row = currentData[i];
        if (!$.isNumeric(row[header[1]])   // Column 1: Data type is float
          || !$.isNumeric(row[header[2]])    // Column 2: Data type is int
          || !$.isNumeric(row[header[3]])) { // Column 3: Data type is int
          return false;
        }
      }
    }
    return true;
  };

  /**
   * render Variable Lifetime Chart
   * @method render
   * @memberOf VariableLifetimeChart
   */
  VariableLifetimeChart.prototype.render = function ( containerWidth, containerHeight) { //div id
    if (this.validate()) {
      // initialize
      this.initialize(containerWidth, containerHeight);
      // convert data
      this.convertData(this.io.data);
      // create chart header
      this.createChartHeader();
      // create axis selectable
      this.createAxisSelectable();
      // create Variable Lifetime Chart
      this.createLifetimeChart();
      return this.svg_dom;
    }
@@return null;
  }

  
  /**
   * initialize
   * @method initialize
   * @memberOf VariableLifetimeChart
   */
  VariableLifetimeChart.prototype.initialize = function (containerWidth, containerHeight) {
    // define width and height of drawing area
    // set width, height
    this.width = containerWidth;
    this.height = containerHeight;
    // set margin
    this.margin = {top: 50, right: 200, bottom: 150, left: 150};
    // generate array color for stroke or fill into line or path
    this.color = d3.scale.ordinal().domain([0, 1, 2]).range(["#8ca68c", "#9ed6d6", "#daf3f3"]);
    // height value for a chart
    this.heightPerRow = 40;
    this.padding = 0;
    // height, width of other charts
    this.heightInnerChart = 10;
    this.heightAxisSelectable = 40;
    this.widthLeftChart = 40;
    // max or min of data
    this.minCycle = 0;
    this.maxCycle = 0;
    // create tooltip
    this.tooltip = CustomTooltip("tooltip", 240);
    // init chart data
    this.charts = [];
    this.chartData = [];
    this.convertedData = [];
    this.svg = null;
    this.selection = [];
  }

  /**
   * convert data if need
   * @method convertData
   * @memberOf VariableLifetimeChart
   */
  VariableLifetimeChart.prototype.convertData = function (data) {
    var self = this,
      rawData = data;

    rawData.forEach(function (d) {
      var obj = {
        name: d.variable_name,
        startX: parseInt(d.start_cycle),
        endX: parseInt(d.end_cycle),
        flag: parseInt(d.rw_flag)
      };
      if (self.selection.indexOf(d.variable_name) === -1) {
        self.selection.push(d.variable_name);
      }
      self.convertedData.push(obj);
    });

    self.chartData = self.parseData(self.convertedData);
    // Compute height if have many charts
    if (self.chartData.length > 0) {
      self.heightPerRow = self.height / self.chartData.length - self.padding;
    }
    // Compute some max or min of data
    self.minCycle = d3.min(self.convertedData, function (d) {
      return d.startX;
    });
    self.maxCycle = d3.max(self.convertedData, function (d) {
      return d.endX;
    });

    // set value after converted data for interface variables
    self.io.setValue('timeRangeX', [self.minCycle, self.maxCycle]);
    self.io.setValue('selection', self.selection);
    // set scope for interface variables
    self.io.setDesigner('timeRangeX', {type: 'slider', value: [self.minCycle, self.maxCycle], range: [self.minCycle, self.maxCycle]});
    self.io.setDesigner('selection', {type: 'selection', range: self.selection});
  }

  /**
   * create header of chart
   * @memberOf VariableLifetimeChart
   * @method createChartHeader
   */
  VariableLifetimeChart.prototype.createChartHeader = function () {
    var self = this;
    self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
    // create svg
    self.svg =  d3.select(self.svg_dom)
      .attr('class', 'variablelifetimechart')
      .attr("width", self.width)
      .attr("height", self.height)
      .attr("viewBox", '0, 0, ' + self.width + ', ' + self.height)
      .attr("preserveAspectRatio", 'none')
     .append("g")
      .attr("transform", "translate(" + self.margin.left + ",0)");
  }

  /**
   * create Lifetime Chart
   * @memberOf VariableLifetimeChart
   * @method createLifetimeChart
   */
  VariableLifetimeChart.prototype.createLifetimeChart = function () {
    var self = this,
      lifetime = [],
      selection = [],
      selectedItems = self.io.getValue('selection'),
      newChartData = [];

    selectedItems.forEach(function (d) {
      if (self.selection.indexOf(d) !== -1) {
        selection.push(d);
      }
    });

    for (var i = 0; i < self.chartData.length; i++) {
      var dataTmp = self.chartData[i];
      if (selection.indexOf(dataTmp.key) !== -1) {
        newChartData.push(dataTmp);
      }
    }
    // get max values array
    for (var i = 0; i < newChartData.length; i++) {
      lifetime.push(
        d3.max(newChartData[i].value, function (d) {
          return d.endX - d.startX;
        })
        );
    }

    var chartDataLength = self.chartData.length,
      newChartDataLength = newChartData.length;
    var ratio = chartDataLength / newChartDataLength;

    // Create each main chart (dependence on chart number)
    for (var i = 0; i < newChartData.length; i++) {
      self.charts.push(new LifetimeChartElement({
        chartType: "for_variables",
        srcChart: "lifetime_variables",
        dstChart: "lifetime_functions",
        menu_id: "#lifetime-variable-menu",
        data: newChartData[i].value,
        id: i + "_var",
        name: newChartData[i].key,
        width: self.width,
        height: self.heightPerRow * ratio,
        totalHeight: self.height,
        heightInnerChart: self.heightInnerChart * ratio,
        padding: self.padding * ratio,
        minCycle: self.minCycle,
        maxCycle: self.maxCycle,
        svg: self.svg,
        margin: self.margin,
        color: self.color,
        showBottomAxis: (i === newChartData.length - 1),
        tooltip: self.tooltip,
        lifttime: lifetime,
        widthLeftChart: self.widthLeftChart,
        chartId: null //containerElement
      }));
    }

    // Create chart legend
    self.drawLegend();
    // save charts
    globalChartsVLCV = self.charts;
  }

  /**
   * create axis selectable
   * @memberOf VariableLifetimeChart
   * @method createAxisSelectable
   */
  VariableLifetimeChart.prototype.createAxisSelectable = function () {
    var self = this,
      // Create Seclectable Chart for x axis
      selectX = new AxisSelectable({
        width: self.width,
        height: self.margin.bottom / 3,
        posX: self.margin.left,
        posY: self.height + self.margin.top + self.margin.bottom / 3,
        startX: self.minCycle,
        endX: self.maxCycle,
        startY: 0,
        endY: 0,
        axisOriented: "bottom",
        charts: self.charts,
        data: self.convertedData,
        svg: self.svg
      });

    // update and render selectable axis
    selectX.update({});
    selectX.render();
  }

  /**
   * create legend of Lifetime Chart
   * @memberOf VariableLifetimeChart
   * @method drawLegend
   */
  VariableLifetimeChart.prototype.drawLegend = function () {
    var self = this,
      // Compute number of variable name
      colorLabel = [];

    self.convertedData.forEach(function (d) {
      colorLabel.push(d.flag);
    });

    colorLabel = colorLabel.filter(function (itm, element, a) {
      return element === a.indexOf(itm);
    });

    // Add Explain Chart to svg tag
    var chartContainer = self.svg.append("g")
      .attr("transform", "translate(" + (self.width + self.margin.left + 20) + "," + self.margin.top + ")");

    colorLabel.forEach(function (d, i) {
      chartContainer.append("rect")
        .attr("class", "legend-rect-var-lifetime")
        .attr("x", 0)
        .attr("y", i * self.heightPerRow)
        .attr("width", self.heightPerRow)
        .attr("height", self.heightPerRow / 2)
        .style("fill", self.color(d));

      var label = "",
        p = parseInt(d);

      if (p === 0) {
        label = "read range";
      }
      else if (p === 1) {
        label = "write range";
      }
      else if (p === 2) {
        label = "alloc-free period";
      }

      chartContainer.append("text")
        .attr("transform", "translate(" + (self.heightPerRow + 10) + "," + (i * self.heightPerRow + self.heightPerRow / 3) + ")")
        .text(label);
    });
  }

  /**
   * parse data function
   * @method parseData
   * @memberOf VariableLifetimeChart
   * @param {type} data
   * @returns {Array}
   */
  VariableLifetimeChart.prototype.parseData = function (data) {
    var parsedData = [];

    // declare a variable to check exist of variable_name in variables array
    var exist = false;
    // perform each element of data.
    data.forEach(function (d) {
      // Check size of array dataByVariable. If size = 0, add first element to array
      if (parsedData.length === 0) {
        // Difine a object include key (is variable_name) and value
        var obj = {
          key: d.name,
          value: []
        };
        // push data to value
        obj.value.push({startX: d.startX, endX: d.endX, flag: d.flag});
        // push obj to dataByVariable array
        parsedData.push(obj);
      }
      else {
        // perform each variable_name of variables array
        for (var j = 0; j < parsedData.length; j++) {
          // if exist, add new value with current key to dataByVariable array
          if (parsedData[j].key === d.name) {
            parsedData[j].value.push({startX: d.startX, endX: d.endX, flag: d.flag});
            exist = true;
            break;
          }
        }

        if (exist === true) {
          exist = false;
        }
        else {
          var obj = {
            key: d.name,
            value: []
          };
          obj.value.push({startX: d.startX, endX: d.endX, flag: d.flag});
          parsedData.push(obj);
        }
      }
    });

    return parsedData;
  }

  return VariableLifetimeChart;
});
