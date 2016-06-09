/**
 * @fileOverview implement for PieChart
 * @author VuongND - modifier
 * @version 1.0
 * @copyright TSDV
 */

/**
 * Initial config additional library files for this chart
 */

/**
 * Create PieChart main function
 * @class PieChart
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {PieChart}
 */
define(["util/tooltip/OldTooltip", "css!./PieChart"], function (CustomTooltip) {
  /**
   * Constructor
   * @class PieChart
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {PieChart}
   */
  var PieChart = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.designManager().setValue({
      changeColumn: [],
      changeAxis: false,
      total: false,
      changeColor: {label: "", color: "#FFFFFF"},
    });
  };

  /**
   * update chart according with changed of interface variables
   * @method PieChart
   * @memberOf PieChart
   * @returns {PieChart}
   */
  PieChart.prototype.update = function (changedAttr) {
    var self = this;
    if (changedAttr.hasOwnProperty("DESIGN_MANAGER")) {
      this.init = false;
      self.convertData(self.io.dataManager().getData());
      self.deleteExistingElements();
      self.createPieChart();
    }
    
    // if changeColor changed
    /*if (changedAttr.hasOwnProperty("changeColor")) {
      // get id of changed color line
      var pathId = "pie_chart_" + changedAttr.changeColor.label.replace(/ /g, "_");
      // change color for chart
      d3.selectAll('path.' + pathId).style('fill', changedAttr.changeColor.color);
      // change color for legend
      d3.select('rect.rect_legend_' + pathId).style('fill', changedAttr.changeColor.color);
      // update color list
      self.colors[changedAttr.changeColor.label] = changedAttr.changeColor.color;
    }*/
  };

  /**
   * This function will validate input data for drawing chart.
   * If data is validate, chart will be drawn.
   * @return {Boolean}
   */
  PieChart.prototype.validate = function () {
    var isValidate = true;
    var currentData = this.io.dataManager().getData();
    // check data empty or not
    if (currentData.length === 0) {
      isValidate = false;
    }
    // if not empty
    else {
      var header = Object.keys(currentData[0]);
      for (var i = 0; i < currentData.length; i++) {
        var row = currentData[i];
        for (var j = 1; j < header.length; j++) {
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
  };
    /**
     * render Pie Chart
     * @method render
     * @memberOf PieChart
     */
    PieChart.prototype.render = function (containerWidth, containerHeight) {
      
        // initialize
        this.initialize(containerWidth, containerHeight);
        // convert data
        this.convertData(this.io.dataManager().getData());
        // create chart header
        this.createChartHeader();
        // create pie chart
        this.createPieChart();
        return this.svg_dom;
      
    };

  /**
   * initialize
   * @method initialize
   * @memberOf PieChart
   */
  PieChart.prototype.initialize = function (containerWidth, containerHeight) {
    // define width and height of drawing area
    // set width, height
    this.width = containerWidth;
    this.height = containerHeight;
    // set margin and legend
    this.margin = 20;
    this.legendPadding = 200;
    this.translateX = 20;
    // set up fill color
    this.color = d3.scale.category20();
    this.colors = {};
    // define tooltip to display some information of when move mouse over each element of chart
    this.tooltip = new CustomTooltip("tooltip", 240);
    // array data for chart
    this.chartData = [];
    this.labels = [];
    this.categories = [];
    this.svg = null;
    this.isChangeAxis = false;
    this.isTotal = false;
    this.init = true;
  };

  /**
   * Get original data
   * @method convertData
   * @memberOf PieChart
   */
  PieChart.prototype.convertData = function (data) {
    var self = this,
      fullColor = [],
      designManager = self.io.designManager();
    //self.io.scopes = {};
    // get data
    self.rawData = data;

    // get labels and categories
    self.labels = d3.keys(self.rawData[0]).filter(function (key) {
      return key !== "category";
    });
    self.categories = [];
    self.rawData.forEach(function (d) {
      self.categories.push(d['category']);
    });

    // set color for labels
    self.labels.forEach(function (d) {
      if (!self.colors[d]) {
        self.colors[d] = self.color(d);
      }
    });
    // set color for categories
    self.categories.forEach(function (d) {
      if (!self.colors[d]) {
        self.colors[d] = self.color(d);
      }
    });
    // set value after converted data for interface variables
    var changeAxis = designManager.getValue("changeAxis");
    if (!changeAxis) {
      designManager.setValue("changeAxis", false);
      changeAxis = false;
    }

    var isSubArray = function (subArray, originArray) {
      var isSub = true;
      for (var i = 0; i < subArray.length; i++) {
        if (originArray.indexOf(subArray[i]) === -1) {
          isSub = false;
          break;
        }
      }

      return isSub;
    };

    var selection = designManager.getValue('changeColumn');
    var realSelection = selection;
    var selectionScopes = self.labels;

    // Calculate real selection correspond to changeAxis variable
    if (changeAxis) {
      if (!isSubArray(selection, self.categories)) {
        realSelection = self.categories;
      }
      selectionScopes = self.categories;
    } else {
      if (!isSubArray(selection, self.labels)) {
        realSelection = self.labels;
      }
      selectionScopes = self.labels;
    }

    if (!isSubArray(selection, self.categories) && !isSubArray(selection, self.labels)) {
      realSelection = [];
    }

    // Only accept when selection is sub array of labels, else set selection is all labels
    if (this.init === true) {
      designManager.setValue('changeColumn', selectionScopes);
    } else if (this.init === false) {
      designManager.setValue('changeColumn', realSelection);
    }
    if (realSelection.length > 0) {
      designManager.setValue('changeColor', {label: realSelection[0], color: self.colors[realSelection[0]]});
    } else {
      designManager.setValue('changeColor', {label: '', color: '#000'});
    }
    // set scope for interface variables
    designManager.setControl('changeColumn', {type: 'selection', range: selectionScopes});
    designManager.setControl('changeAxis', {type: 'checkbox', name: 'Change Axis'});
    designManager.setControl('total', {type: 'checkbox', name: 'Total'});
    designManager.setControl('changeColor', {type: 'colorPicker', value: self.colors, range: selectionScopes});
    
  };

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf PieChart
   */
  PieChart.prototype.createChartHeader = function () {
    var self = this;
    self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
    // create svg
    self.svg =  d3.select(self.svg_dom)
      .attr('class', 'piechart')
      .attr("width", self.width)
      .attr("height", self.height)
      .attr("preserveAspectRatio", 'xMidYMid meet')
      .append("g")
      .attr("transform", "translate(" + self.translateX + ",0)");
  };

  /**
   * create pie chart
   * @method createPieChart
   * @memberOf PieChart
   */
  PieChart.prototype.createPieChart = function () {
    var selection = this.io.designManager().getValue("changeColumn");
    // check selection
    if (Array.isArray(selection)) {
      this.drawPieChart();
    }
  };

  /**
   * draw pie chart with specified data
   * @method drawPieChart
   * @memberOf PieChart
   * @returns {undefined}
   */
  PieChart.prototype.drawPieChart = function () {
    // init local variables
    var self = this,
      changeColor = self.io.designManager().getValue("changeColor"),
      radius = 0,
      finalData = [],
      chartData = [],
      transform = [],
      titleData = [],
      legendData = [],
      standardizedData = {},
      calculatedData = {};

    // standardize data for Pie chart
    standardizedData = self.standardizeDataForPieChart();
    // calculate to get value of radius and position for each Pie
    calculatedData = self.calculatePositionAndRadius(standardizedData);
    // set value for local variables
    radius = calculatedData.radius;
    transform = calculatedData.transform;
    finalData = standardizedData.finalData;
    titleData = standardizedData.titleData;
    legendData = standardizedData.legendData;

    // arc() function helps draw SVG paths
    var arc = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(radius);

    var gPie = self.svg.selectAll("g")
      .data(finalData)
      .enter().append("g")
      .attr("class", "pie")
      .attr("transform", function (d, i) {
        return "translate(" + transform[i].x + "," + transform[i].y + ")";
      });

    // draw title for each chart
    gPie.append("text")
      .attr("transform", function (d) {
        return "translate(0," + (-radius - 10) + ")";
      })
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .text(function (d, i) {
        return titleData[i];
      });

    var g = gPie.selectAll(".arc")
      .data(d3.layout.pie())
      .enter().append("g")
      .on("mouseover", function (d, i) {
        var name = legendData[i];
        return self.showDetails(d, name, this);
      })
      .on("mouseout", function (d, i) {
        return self.hideDetails(d, i, this);
      })
      //.on("contextmenu", self.rightClick())
      .attr("class", "arc")
      .text(function (d) {
        return d;
      });

    g.append("path")
      .attr("class", function (d, i) {
        var name = legendData[i];
        return "pie_chart_" + name.replace(/ /g, "_");
      })
      .attr("d", arc)
      .style("fill", function (d, i) {
        var name = legendData[i];
        return (changeColor.label === name) ? changeColor.color : self.colors[name];
      });

    g.append("text")
      .attr("transform", function (d) {
        return "translate(" + arc.centroid(d) + ")";
      })
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .text(function (d) {
        return d.data;
      });

    // draw legend
    self.drawLegend(legendData, calculatedData);
  };

  /**
   * For calculate position and radius
   * @method calculatePositionAndRadius
   * @memberOf PieChart
   * @returns {undefined}
   */
  PieChart.prototype.calculatePositionAndRadius = function (standardizedData) {
    // init local variable
    var self = this,
      w = (self.width - self.margin),
      h = (self.height - self.margin),
      radius = 0,
      radius_w = 0,
      radius_h = 0,
      chartNumber = 0,
      rowNumber = 0,
      colNumber = 0,
      transform = [];

    // get standardized data
    chartNumber = standardizedData.chartNumber;
    rowNumber = standardizedData.rowNumber;
    colNumber = standardizedData.colNumber;

    if (rowNumber === 0 && colNumber === 0) {
      // check number of Pie is odd or even
      if (chartNumber % 2 !== 0) {
        // add 1 to number of Pie because use even to calculate rows and cols
        chartNumber = chartNumber + 1;
      }
      // if width larger than height
      if (w > h) {
        // the number of Pie will fit SVG
        // using formula Number of Pie(N) = Columns(C) x Rows(R) then C = N/R
        // then diameter = radius*2 = Width(W)/C or Height(H)/R
        // replace C = N/R then W/(N/R) = H/R
        // then W*R/N = H/R, then R*R = (H*N)/W,
        // then C = sqrt(W*N/H)
        colNumber = (w / h > 3) ? chartNumber : Math.round(Math.sqrt((w * chartNumber) / h));
        // then R = sqrt(H*N/W) or N/C
        rowNumber = Math.round(chartNumber / colNumber);
        // in the case row is 1 and number of Pie is different with cols then add 1 row
        if (chartNumber !== colNumber && rowNumber === 1) {
          rowNumber = rowNumber + 1;
        }
      }
      else {
        // then R = sqrt(H*N/W)
        rowNumber = (h / w > 3) ? chartNumber : Math.round(Math.sqrt((h * chartNumber) / w));
        // then C = sqrt(W*N/H) or N/R
        colNumber = Math.round(chartNumber / rowNumber);
        // in the case col is 1 and number of Pie is different with rows then add 1 col
        if (chartNumber !== rowNumber && colNumber === 1) {
          colNumber = colNumber + 1;
        }
      }
      // calculate radius = sqrt((w*h)/N)/2
      radius = Math.sqrt(w * h / chartNumber) / 2;
    }
    // in the case view total
    else {
      radius_w = (self.width - self.margin * (colNumber + 1)) / (2 * colNumber);
      radius_h = (self.height - self.margin * (rowNumber + 1)) / (2 * rowNumber);

      if ((2 * radius_w * rowNumber + self.margin * (rowNumber + 1)) <= self.height) {
        radius = radius_w;
      } else {
        radius = radius_h;
      }
    }
    // calculate padding for Pie chart
    var paddingW = (w - ((colNumber) * radius)) / colNumber;
    var paddingH = (h - ((rowNumber) * radius)) / rowNumber;

    // calculate position for each pie
    for (var i = 0; i < rowNumber; i++) {
      for (var j = 0; j < colNumber; j++) {
        var position = {
          x: (colNumber === 1) ? w / 2 : paddingW * j + self.margin * (j + 1) + radius * (2 * j + 1),
          y: (rowNumber === 1) ? h / 2 : paddingH * i + self.margin * (i + 1) + radius * (2 * i + 1)
        };
        if (transform.length < chartNumber) {
          transform.push(position);
        }
      }
    }

    return {
      transform: transform,
      radius: radius,
      colNumber: colNumber,
      rowNumber: rowNumber,
      padding: paddingW
    };
  };

  /**
   * For draw legend
   * @method drawLegend
   * @memberOf PieChart
   * @returns {undefined}
   */
  PieChart.prototype.drawLegend = function (legendData, calculatedData) {
    var self = this,
      changeColor = self.io.designManager().getValue("changeColor"),
      legend = null,
      pos = calculatedData.transform[calculatedData.colNumber - 1].x + calculatedData.radius * 2;

    legend = self.svg.selectAll(".legend")
      .data(legendData.slice())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function (d, i) {
        return "translate(" + pos + "," + i * 20 + ")";
      });

    legend.append("rect")
      .attr("class", function (d, i) {
        return "rect_legend_pie_chart_" + d.replace(/ /g, "_");
      })
      .attr("x", 0)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", function (d) {
        return (changeColor.label === d) ? changeColor.color : self.colors[d];
      });

    legend.append("text")
      .attr("x", -10)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function (d) {
        return d;
      });
  };

  /**
   * For converting data to necessary data when change axis or draw total data
   * @method checkCheckboxValue
   * @memberOf PieChart
   * @returns {Object}
   */
  PieChart.prototype.standardizeDataForPieChart = function (opt) {
    // init local variable
    var self = this,
      selection = self.io.designManager().getValue("changeColumn"),
      changeAxis = self.io.designManager().getValue("changeAxis"),
      total = self.io.designManager().getValue("total"),
      obj = {
        finalData: [],
        legendData: [],
        chartNumber: 0,
        rowNumber: 0,
        colNumber: 0,
        titleData: []
      },
    tempData = [],
      chartData = [];

    // if changeAxis is true
    if (changeAxis === true) {
      // change rows and column
      self.labels.forEach(function (label) {
        var temp = {};
        self.categories.forEach(function (category) {
          self.rawData.forEach(function (d) {
            if (d['category'] === category) {
              temp[category] = d[label];
            }
          });
        });
        tempData.push(temp);
      });

      // get only selected data to draw chart
      tempData.forEach(function (d) {
        var temp = {};
        selection.forEach(function (selected) {
          temp[selected] = d[selected];
        });

        chartData.push(temp);
      });

      chartData.forEach(function (d) {
        var temp = [];
        selection.forEach(function (selected) {
          temp.push(d[selected]);
        });
        obj.finalData.push(temp);
      });
    }
    // if Change Axis checkbox is not checked
    else {
      // get only selected data
      self.rawData.forEach(function (d) {
        var temp = {};

        selection.forEach(function (selected) {
          temp[selected] = d[selected];
        });

        chartData.push(temp);
      });

      chartData.forEach(function (d) {
        var temp = [];
        selection.forEach(function (selected) {
          temp.push(d[selected]);
        });
        obj.finalData.push(temp);
      });
    }

    // get other data
    obj.titleData = (changeAxis === true) ? self.labels : self.categories;
    obj.legendData = selection;
    obj.chartNumber = obj.titleData.length; // number of charts to be showed

    // if Total checkbox is checked
    if (total === true) {
      var temp = [];

      selection.forEach(function (d, i) {
        var total = 0;
        obj.finalData.forEach(function (row) {
          total += parseFloat(row[i]);
        });
        temp.push(total);
      });

      obj.finalData = [];
      obj.finalData.push(temp);
      obj.chartNumber = 1;
      obj.rowNumber = 1;
      obj.colNumber = 1;
      obj.titleData = ['Total'];
      obj.legendData = selection;
    }

    return obj;
  };

  /**
   * delete all child elements of current svg
   * @method deleteExistingElements
   * @memberOf PieChart
   * @returns {undefined}
   */
  PieChart.prototype.deleteExistingElements = function () {
    var self = this;
    if (self.svg !== undefined && self.svg !== null) {
      // delete existing elements of svg before redraw
      self.svg.selectAll("*").remove();
      // clear data to redraw
      self.chartData = [];
    }
  };


  /**
   * Show tooltips
   * @param {type} data
   * @param {type} i
   * @param {type} element
   */
  PieChart.prototype.showDetails = function (data, name, element) {
    // Hold content of tooltip
    var content = "";

    content = "<span class=\"name\">Name:</span><span class=\"value\"> " + name + "</span><br/>";
    content += "<span class=\"name\">Value:</span><span class=\"value\"> " + data.value + "</span><br />";
    return this.tooltip.showTooltip(content, d3.event);
  };

  /**
   * Hide tooltips
   */
  PieChart.prototype.hideDetails = function () {
    return this.tooltip.hideTooltip();
  };

  /**
   * Display context menu for Pie chart
   * @method rightClick
   * @memberOf PieChart
   * @private
   */
  PieChart.prototype.rightClick = function () {
    // Declare variable to hold position x and y when right click
    var x, y;

    if (d3.event.pageX || d3.event.pageY) {
      x = d3.event.pageX;
      y = d3.event.pageY;
    } else if (d3.event.clientX || d3.event.clientY) {
      x = d3.event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      y = d3.event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    // Show context menu
    d3.select("#piechart-menu").style('position', 'absolute')
      .style("z-index", 1)
      .style('top', y + 'px')
      .style('left', x + 'px')
      .style('display', 'block');

    // Prevent default right click
    d3.event.preventDefault();

    // Hide context menu when click out side
    $(document).bind("click keyup", function (event) {
      d3.select("#piechart-menu").style('display', 'none');
    });

    // Set event listener for item of context menu
    d3.select("#piechart-menu")
      .selectAll("li")
      .on("click", function (d, i) {
        if (i === 0) {
          // do nothing
        } else if (i === 1) {
          // do nothing
        } else {
          // do nothing
        }
      });
  };

  return PieChart;
});
