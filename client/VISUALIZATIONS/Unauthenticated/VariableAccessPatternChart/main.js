/**
 * Create VariableAccessPatternChart main function
 * @class VariableAccessPatternChart
 * @param {type} VAP-Element ChartElement class
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {VariableAccessPatternChart}
 */
define(["./ChartElement", "util/tooltip/OldTooltip", "css!./VariableAccessPatternChart"], function (ChartElement, CustomTooltip) {
  /**
   * Constructor
   * @class VariableAccessPatternChart
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {VariableAccessPatternChart}
   */
  var VariableAccessPatternChart = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.setValue({
      selection: [],
      changeColor: {label: "", color: "#FFFFFF"},
      timeRangeX: [0, 0]
    });
  };

  /**
   * update chart according with changed of interface variables
   * @method VariableAccessPatternChart
   * @memberOf VariableAccessPatternChart
   * @returns {VariableAccessPatternChart}
   */
  VariableAccessPatternChart.prototype.update = function (changedAttr) {
    var self = this;

    // if selection changed
    if (changedAttr.hasOwnProperty("selection")) {
      self.deleteExistingElements();
      self.createPatternChart();
      self.createLeftChart();
      self.createContextChart();
    }

    // if timeRangeX changed
    if (changedAttr.hasOwnProperty("timeRangeX")) {
      self.charts.forEach(function (d) {
        d.showOnly([changedAttr.timeRangeX[0], changedAttr.timeRangeX[1]]);
      });
    }

    // if changeColor changed
    if (changedAttr.hasOwnProperty("changeColor")) {
      // get id of changed color line
      var pathId = "access_pattern_" + changedAttr.changeColor.label.replace(/ /g, "_");
      // change color for chart
      d3.selectAll('path#' + pathId).style('stroke', changedAttr.changeColor.color);
      // change color for legend
      d3.select('rect#left_chart_' + pathId).style('fill', changedAttr.changeColor.color);
      // update color list
      self.colors[changedAttr.changeColor.label] = changedAttr.changeColor.color;
    }
  };

  /**
   * This function will validate input data for drawing chart.
   * If data is validate, chart will be drawn.
   * @returns {Boolean}
   */
  VariableAccessPatternChart.prototype.validate = function () {
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
        if (!$.isNumeric(row[header[0]]) // Column 1: is interget number
          || !$.isNumeric(row[header[2]])) { // Column 3: is float number
          isValidate = false;
          break;
        }
      }
    }

    return isValidate;
  },
    /**
     * RENDER
     * @param {type} containerElement
     * @param {type} containerWidth
     * @param {type} containerHeight
     * @param {type} params
     * @returns {VariableAccessPatternChart}
     */
    VariableAccessPatternChart.prototype.render = function ( containerWidth, containerHeight) {
      // validate data
      var isOk = this.validate();
      if (isOk) {
        // initialize
        this.initialize(containerWidth, containerHeight);
        // convert data
        this.convertData(this.io.data);
        // create header
        this.createChartHeader();
        // create chart
        this.createPatternChart();
        // create Left chart that show information of main chart
        this.createLeftChart();
        // create Context chart
        this.createContextChart();
        return this.svg_dom;
      }
      else {
        alert('Variable Access Pattern Chart Data error!');
        return null;
      }
    };

  /**
   * initialize
   * @method initialize
   * @memberOf VariableAccessPatternChart
   */
  VariableAccessPatternChart.prototype.initialize = function (containerWidth, containerHeight) {
    // init name
    this.srcChart = "variable_access_pattern";
    // define width and height of drawing area
    // set width, height
    this.width = containerWidth;
    this.height = containerHeight;
    // init others
    this.tooltip = new CustomTooltip("tooltip", 240);
    this.heightPerRow = 60;
    this.contextHeight = 30;
    // set margin and legend
    this.margin = {top: 50, right: 40, bottom: 50, left: 75};
    // Generate array color for stroke or fill into line or path
    this.color = d3.scale.category10();
    this.colors = {};
    // Hold space drawing
    this.svg = null;
    // Hold all main charts if drawing
    this.charts = [];
    this.selection = [];
    this.patternData = null;
    this.dataError = false;
  }


  /**
   * convert data if need
   * @method convertData
   * @param {Object} rawData description
   * @memberOf VariableAccessPatternChart
   */
  VariableAccessPatternChart.prototype.convertData = function (data) {
    var self = this,
      newData = [],
      rawData = data;

    rawData.forEach(function (d) {
      var obj = {
        x: d.cycle,
        y: d.variable_name,
        z: d.access_frequency
      };
      // get list of variable
      if (self.selection.indexOf(d.variable_name) < 0) {
        // push into list
        self.selection.push(d.variable_name);
        // set color
        self.colors[d.variable_name] = self.color(d.variable_name);
      }
      // set data
      newData.push(obj);
    });

    self.patternData = newData;

    /**
     * Declare a variable is a array.
     * Each element in array is a object include a key and a value.
     * A key is y value. Each key is different
     * A value is a array. Each element in that array is object
     * include a x is x value and a z is z value
     */
    self.dataByY = self.parseData(self.patternData);

    // Compute max and min of data
    self.startX = d3.min(self.patternData, function (d) {
      return parseInt(d.x);
    });
    self.endX = d3.max(self.patternData, function (d) {
      return parseInt(d.x);
    });
    self.minZ = d3.min(self.patternData, function (d) {
      return parseFloat(d.z);
    });
    self.maxZ = d3.max(self.patternData, function (d) {
      return parseFloat(d.z);
    });

    // set value after converted data for interface variables
    self.io.setValue('selection', self.selection);
    self.io.setValue('changeColor', {label: self.selection[0], color: self.colors[self.selection[0]]});
    self.io.setValue('timeRangeX', [self.startX, self.endX]);
    // set scope for interface variables
    self.io.setDesigner('selection', {type: 'selection', range: self.selection});
    self.io.setDesigner('changeColor', {type: 'colorPicker', value: self.colors, range: self.selection});
    self.io.setDesigner('timeRangeX', {type: 'slider', value: [self.startX, self.endX], range: [self.startX, self.endX]});
  }

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf VariableAccessPatternChart
   */
  VariableAccessPatternChart.prototype.createChartHeader = function () {
    var self = this;
    self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
    // create svg
    self.svg =  d3.select(self.svg_dom)
      .attr('class', 'variableaccesspatternchart')
      .attr('id', "variable_access_pattern")
      .attr("width", self.width)
      .attr("height", self.height)
      .on("mousedown", function () {
        //d3.event.stopPropagation(); //delete it to enable drag&drop to move chart
      });

    self.mainChart = self.svg.append("g");
  }

  /**
   * create Pattern Chart
   * @memberOf VariableAccessPatternChart
   * @method createPatternChart
   */
  VariableAccessPatternChart.prototype.createPatternChart = function () {
    var self = this,
      selection = [],
      selectedItems = self.io.getValue("selection"),
      changeColor = self.io.getValue("changeColor"),
      lineColor = "",
      newData = [];

    selectedItems.forEach(function (d) {
      if (self.selection.indexOf(d) !== -1) {
        selection.push(d);
      }
    });

    // set height value
    if (selection.length > 0) {
      self.heightPerRow = self.height * 0.6 / selection.length;
    }

    for (var i = 0; i < self.dataByY.length; i++) {
      if (selection.indexOf(self.dataByY[i].key) >= 0) {
        newData.push(self.dataByY[i]);
      }
    }
    ;
    // Create for chart elements (depend on number of variables)
    for (var i = 0; i < newData.length; i++) {
      if (selection.indexOf(newData[i].key) >= 0) {
        lineColor = (changeColor.label === newData[i].key) ?
          changeColor.color : self.colors[newData[i].key];

        self.charts.push(new ChartElement({
          data: newData[i].value,
          svg: self.mainChart,
          id: i,
          name: newData[i].key,
          width: self.width,
          height: self.heightPerRow,
          margin: self.margin,
          startCycle: self.startX,
          endCycle: self.endX,
          minAccessFrequency: self.minZ,
          maxAccessFrequency: self.maxZ,
          showBottomAxis: (i === selection.length - 1),
          color: lineColor
        }));
      }
    }

    // save charts
    globalChartsVAPM = self.charts;
  }

  /**
   * Draw a chart that show information of main chart
   * @returns {LeftChart}
   */
  VariableAccessPatternChart.prototype.createLeftChart = function () {
    var self = this,
      selection = [],
      selectedItems = self.io.getValue("selection"),
      changeColor = self.io.getValue("changeColor"),
      height = 40;
    dataset = [];

    selectedItems.forEach(function (d) {
      if (self.selection.indexOf(d) !== -1) {
        selection.push(d);
      }
    });

    // standardize data
    for (var i = 0; i < self.dataByY.length; i++) {
      if (selection.indexOf(self.dataByY[i].key) >= 0) {
        dataset.push(d3.max(self.dataByY[i].value, function (d) {
          return parseFloat(d.z);
        }));
      }
    }

    //Create domain and range scale fox x axis
    var x = d3.scale.linear().domain([0, d3.max(dataset)]).range([0, height]),
      //Create domain and range scale fox x axis
      y = d3.scale.ordinal().rangeRoundBands([0, height], .2);
    // Add g tag to draw leftchart
    self.leftChart = self.svg.append("g")
      .attr("class", "leftchart")
      .attr("transform", "translate(" + 0 + "," + self.margin.top + ")");
    // Map data to chart and add attributes for display chart
    self.leftChart.selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("class", "rect_access_pattern")
      .attr("id", function (d, i) {
        return "left_chart_access_pattern_" + selection[i];
      })
      .style("fill", function (d, i) {
        return (changeColor.label === selection[i]) ? changeColor.color : self.colors[selection[i]];
      })
      .attr("x", function (d) {
        return x(d3.max(dataset) - d);
      })
      .attr("y", function (d, i) {
        return i * (self.heightPerRow);
      })
      .attr("width", function (d) {
        return Math.abs(x(d) - x(0));
      })
      .attr("height", self.heightPerRow)
      .on("mouseover", function (d, i) {
        return self.showTooltip(d, i, this);
      })
      .on("mouseout", function (d, i) {
        return self.hideTooltip();
      });
    //.on("contextmenu", rightclick);
  };

  /**
   * create Context Chart
   * @memberOf VariableAccessPatternChart
   * @method createContextChart
   */
  VariableAccessPatternChart.prototype.createContextChart = function () {
    var self = this,
      selection = [],
      selectedItems = self.io.getValue("selection"),
      contextData = [];

    selectedItems.forEach(function (d) {
      if (self.selection.indexOf(d) !== -1) {
        selection.push(d);
      }
    });

    if (selection.length > 0) {
      // Create range and domain scale for x axis
      self.contextXScale = d3.scale.linear()
        .range([0, self.width])
        .domain([self.startX, self.endX]);
      // init local variables
      // Create range and domain scale for y axis
      var contextYScale = d3.scale.linear()
        .range([self.contextHeight, 0])
        .domain(self.charts[0].yScale.domain()),
        // Define axis for ContextChart
        contextAxis = d3.svg.axis()
        .scale(self.contextXScale)
        .orient("bottom"),
        // Create area to display ContextChart
        contextArea = d3.svg.area()
        .interpolate("basis")
        .x(function (d) {
          return self.contextXScale(d.x);
        })
        .y0(self.contextHeight)
        .y1(function (d) {
          return contextYScale(d.z);
        });

      // Create a overlay brush to control MainChart
      self.brush = d3.svg.brush()
        .x(self.contextXScale)
        .on("brush", onBrush);

      // Add g tag to draw leftchart
      self.context = self.svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + (self.margin.left * 2) + "," + (self.heightPerRow * selection.length + self.margin.top + self.margin.bottom) + ")");

      // add axis to leftchart
      self.context.append("g")
        .attr("class", "context axis")
        .attr("transform", "translate(0," + (self.contextHeight / 2) + ")")
        .call(contextAxis);

      contextData = self.patternData.filter(function (d) {
        return (selection.indexOf(d.y) >= 0);
      });

      contextData.sort(function (a, b) {
        return a.x - b.x;
      });

      // Map data and area to display chart
      self.context.append("path")
        .datum(contextData)
        .attr("d", contextArea)
        .attr("transform", "translate(0," + (-self.contextHeight / 2) + ")");

      // Add overlay brush above area of ContextChart
      self.context.append("g")
        .attr("class", "x brush")
        .call(self.brush)
        .selectAll("rect")
        .attr("transform", "translate(0," + (-self.contextHeight / 2) + ")")
        .attr("height", self.contextHeight);
    }


    /**
     * listen event brush on axis selectable
     * @memberOf VariableAccessPatternChart
     * @method onBrush
     */
    function onBrush() {
      var b = self.brush.empty() ? self.contextXScale.domain() : self.brush.extent();

      for (var i = 0; i < selection.length; i++) {
        self.charts[i].showOnly(b);
      }
    }
  }

  /**
   * Display context menu for Flowchart
   * @method rightclick
   * @private
   * @memberOf VariableAccessPatternChart
   */
  VariableAccessPatternChart.prototype.rightclick = function () {
    // Declare variable to hold position x and y when right click
    var self = this,
      x, y;

    if (d3.event.pageX || d3.event.pageY) {
      x = d3.event.pageX;
      y = d3.event.pageY;
    } else if (d3.event.clientX || d3.event.clientY) {
      x = d3.event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      y = d3.event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    // Show context menu
    d3.select("#variableaccesspattern-menu").style('position', 'absolute')
      .style('top', y + 'px')
      .style('left', x + 'px')
      .style('display', 'block');

    // Prevent default right click
    d3.event.preventDefault();

    // Hide context menu when click out side
    $(document).bind("click keyup", function (event) {
      d3.select("#variableaccesspattern-menu").style('display', 'none');
    });

    // Set event listener for item of context menu
    d3.select("#variableaccesspattern-menu")
      .selectAll("li")
      .on("click", function (d, i) {
        if (i === 0) {
          d3.select("#variableaccesspattern-menu").style('display', 'none');
          // VLC for Variables
          Transit.Transit(self.srcChart, "lifetime_variables", self.containerId);
        } else if (i === 1) {
          d3.select("#variableaccesspattern-menu").style('display', 'none');
          // VLC for Functions/Scopes
          Transit.Transit(self.srcChart, "lifetime_functions", self.containerId);
        } else if (i === 2) {
          d3.select("#variableaccesspattern-menu").style('display', 'none');
          // VLC for Bubble Chart
          Transit.Transit(self.srcChart, "bubble_chart", self.containerId);
        }
        else {
          // do nothing
        }
      });
  }

  /**
   * Show tooltip when moveover in leftchart
   * @param {type} dataMax
   * @param {type} i
   * @param {type} element
   */
  VariableAccessPatternChart.prototype.showTooltip = function (data, i, element) {
    var content = "<span class=\"name\">Max Access Frequency : </span><span class=\"value\"> " + data + "</span>";

    d3.select(element).attr("stroke", "black");

    return this.tooltip.showTooltip(content, d3.event);
  };

  /**
   * Hide tooltip when moveover out leftchart
   */
  VariableAccessPatternChart.prototype.hideTooltip = function () {
    return this.tooltip.hideTooltip();
  };

  /**
   * remove currend svg and reset data to draw other type of chart
   * @method params
   * @memberOf VariableAccessPatternChart
   */
  VariableAccessPatternChart.prototype.deleteExistingElements = function () {
    var self = this,
      selection = self.io.getValue("selection");
    // delete existing elements of svg before redraw
    self.mainChart.remove();
    self.leftChart.remove();
    self.context.remove();
    // clear data to redraw
    self.charts = [];
    // reset svg
    self.mainChart = self.svg.append("g");
    self.leftChart = self.svg.append("g")
      .attr("class", "leftchart")
      .attr("transform", "translate(" + 0 + "," + self.margin.top + ")");
    self.context = self.svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + (self.margin.left * 2) + "," + (self.heightPerRow * selection.length + self.margin.top + self.margin.bottom) + ")");
  }

  /**
   * parse data function
   * @method parseData
   * @memberOf VariableAccessPatternChart
   * @param {type} data
   * @returns {Array}
   */
  VariableAccessPatternChart.prototype.parseData = function (data) {
    if (this.dataError !== true) {
      var parsedData = [],
        // declare a variable to check exist of variable_name in variables array
        exist = false;

      // perform each element of data.
      data.forEach(function (d) {
        // Check size of array dataByVariable. If size = 0, add first element to array
        if (parsedData.length === 0) {
          // Difine a object include key (is variable_name) and value
          var obj = {
            key: d.y,
            value: []
          };

          // push data to value
          obj.value.push({x: d.x, z: d.z});

          // push obj to dataByVariable array
          parsedData.push(obj);
        } else {
          // perform each variable_name of variables array
          for (var j = 0; j < parsedData.length; j++) {
            // if exist, add new value with current key to dataByVariable array
            if (parsedData[j].key === d.y) {
              parsedData[j].value.push({x: d.x, z: d.z});
              exist = true;
              break;
            }
          }
          if (exist === true) {
            exist = false;
          } else {
            var obj = {
              key: d.y,
              value: []
            };
            obj.value.push({x: d.x, z: d.z});
            parsedData.push(obj);
          }
        }
      });
    } else {
      return [];
    }

    return parsedData;
  }

  return VariableAccessPatternChart;
});
