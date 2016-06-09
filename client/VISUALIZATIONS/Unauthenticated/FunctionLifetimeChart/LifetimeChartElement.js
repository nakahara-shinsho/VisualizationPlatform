
  /**
   * Draw Main Chart to show information of Chart need draw
   * @param {type} Some parameter
   * @returns {Chart} Draw Chart
   */
   
define(function() {

  var LifetimeChartElement = function(options) {
    // get transit object
    //this.transit = require('./Transit');
    // chart type (functions or variables)
    this.chartType = options.chartType;
    // chart menu id
    this.menu_id = options.menu_id;
    // for transition
    this.srcChart = options.srcChart;
    this.dstChart = options.dstChart;
    // id of chart
    this.id = options.id;
    // index of id
    this.idxId = parseInt(options.id.split('_')[0]);
    // name of chart
    this.name = options.name;
    // Margin of main chart
    this.margin = options.margin;
    // Data after parsing to follow chart
    this.chartData = options.data;
    // Color to show on each chartId of chart. Same name same color
    this.color = options.color;
    // get svg
    this.svg = options.svg;
    // get html chart id
    this.chartId = options.chartId;
    // Width and height of main chart
    this.width  = options.width;
    this.height = options.height;
    this.heightFixed = options.height;
    this.totalHeight = options.totalHeight;
    this.heightInnerChart = options.heightInnerChart;
    this.padding = options.padding;

    // get min, max cycle
    this.minCycle = options.minCycle;
    this.maxCycle = options.maxCycle;

    this.moving = 0;
    this.tooltip = options.tooltip;

    // Create local Chart to use in function of class Chart
    var _this = this;

    // Create range and domain scale for x axis
    this.xScale = d3.scale.linear()
      .range([0, this.width])
      .domain([this.minCycle, this.maxCycle]);

    this.xScaleClip = d3.scale.linear()
      .range([0, this.width])
      .domain([0, this.width]);

    this.yScale = d3.scale.linear()
      .domain([this.height, 0])
      .range([this.height, 0]);

    // Create local xScale, yScale
    var xS = this.xScale;
    var yS = this.yScale;

    // Create line to draw on chart
    this.line = d3.svg.line()
      .interpolate("linear-closed")
      .x(function (d) {return _this.xScale(d.x);})
      .y(function (d) {return _this.yScale(d.y);});

    this.clipPath = this.svg.append("defs").append("clipPath")
      .attr("id", "clip" + this.id)
      .append("rect")
      .attr("id", "clip-rect" + this.id)
      .attr("width", this.width)
      .attr("height", yS(this.height));

    // Create space to draw chart
    this.chartContainer = this.svg.append("g")
      .attr("id", "g" + this.id)
      .attr("class", "function")
      .attr("transform", "translate(" + this.margin.left + ","+ (this.margin.top + this.idxId * (this.height + this.padding) )+")");

    var heightPadding = (this.height - this.heightInnerChart) / 2;

    var freeData=[], rwData=[];

    this.chartData.forEach(function (d) {
      if (d.flag === 2) {
          freeData.push(d);
      } else {
          rwData.push(d);
      }
    });

    var classline = "";

    freeData.forEach(function (d, i) {
      var localData = [];
      var flag = d.flag;
      classline = "line-free";
        localData.push({x : d.startX, y : 0 });
        localData.push({x : d.endX,   y : 0 });
        localData.push({x : d.endX,   y : _this.height});
        localData.push({x : d.startX, y : _this.height});

      var localChart = _this.chartContainer.append("path")
        .datum(localData)
        .attr("id", "id" + i)
        .attr("class", classline)
        .attr("flag", "flag-" + flag)
        .attr("clip-path", "url(#clip" + _this.id + ")")
        // Add attribute of this path, it is a line and define in line variable
        .attr("d", _this.line)
        // Fill color for this path
        .style("fill", _this.color(flag))
        //.style("fill-opacity", 0.5)
        // Set width stroke of this path
        .style("stroke-width", 0)
        // Show tooltip when move mouse over this path
        .on("mouseover", function () {
            //return _this.showTooltip(iChartData, this);
        })
        // Hide tooltip when move mouse over this path
        .on("mouseout", function(d, i) {
            //return _this.hideTooltip(d, iChartData, this);
        });
    });

    rwData.forEach(function (d, i) {
      var localData = [];
      var flag = d.flag;

      // check flag
      if (flag === 0) {
          classline = "line-read";
      } else if (flag === 1){
          classline = "line-write";
      }

      // create localData
      localData.push({x : d.startX, y: heightPadding});
      localData.push({x : d.endX,   y: heightPadding});
      localData.push({x : d.endX,   y: heightPadding + _this.heightInnerChart });
      localData.push({x : d.startX, y: heightPadding + _this.heightInnerChart });

      // create main chart
      var iChartData = d;
      var localChart = _this.chartContainer.append("path")
        .datum(localData)
        .attr("id", "id" + i)
        .attr("class", "line-rw")
        .attr("flag", "rw")
        .attr("clip-path", "url(#clip" + _this.id + ")")
        // Add attribute of this path, it is a line and define in line variable
        .attr("d", _this.line)
        // Fill color for this path
        .style("fill", _this.color(flag))
        .style("fill-opacity", 0.7)
        // Set width stroke of this path
        .style("stroke-width", 0)
        // Show tooltip when move mouse over this path
        .on("mouseover", function () {
            return _this.showTooltip(iChartData, this);
        })
        // Hide tooltip when move mouse over this path
        .on("mouseout", function(d, i) {
            return _this.hideTooltip(d, iChartData, this);
        })
        .on("mousedown" , function () {
            d3.event.stopPropagation();
        });

    });

    // create left chart of LifetimeChart for Variables
    if (options.chartType === 'for_variables') {
      // Hold lifttime of all chart
      this.liftime = options.lifttime;

      this.widthLeftChart = options.widthLeftChart;

      var maxLifttime = d3.max(this.liftime);
      var currentLifttime = this.liftime[this.idxId];

      this.xScaleLeftChart = d3.scale.linear()
          .range([0, this.widthLeftChart])
          .domain([0, maxLifttime]);
      this.yScaleLeftChart = d3.scale.linear()
          .domain([0, this.height])
          .range([0, this.height]);

      this.lineLeftChart = d3.svg.line()
          .interpolate("linear-closed")
          .x(function (d) {return _this.xScaleLeftChart(d.x);})
          .y(function (d) {return _this.yScaleLeftChart(d.y);});

      // Draw left chart
      this.leftData = [];

      this.leftData.push({x : maxLifttime - currentLifttime, y : 0});
      this.leftData.push({x : maxLifttime, y : 0});
      this.leftData.push({x : maxLifttime, y : this.height});
      this.leftData.push({x : maxLifttime - currentLifttime, y : this.height});

      this.chartContainer.append("path")
        .datum(this.leftData)
        .attr("class", "line-left")
        .attr("transform", "translate(-120, 0)")
        .attr("id", this.id)
        .attr("d", _this.lineLeftChart)
        .style("fill", this.color(2))
        .on("contextmenu", $.proxy(this.rightClickLeftChart, this))
          .on("mousedown" , function () {
              d3.event.stopPropagation();
          });
    }

    this.chartContainer.append("text")
      .attr("class", "y-name")
      .attr("x", 0)
      .attr("y", 0)
      .attr("transform", "translate(" + - (_this.margin.left / 3) + ","+ (heightPadding + _this.heightInnerChart) +")")
      .text(_this.name)
      .on("click", $.proxy(this.onClickName, this))
      .on("contextmenu", $.proxy(this.rightClickLeftChart, this));

    // Create x axis
    this.xAxis = d3.svg.axis().scale(this.xScale).orient("bottom");

    // Show x axis to chart
    this.showBottomAxis = options.showBottomAxis;
    
    if (this.showBottomAxis) {
      this.chartContainer.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis)
        .append("text")
        .attr("class", "x-label")
        .attr("transform", "translate(" + this.width + ", 15)")
        .text('Execution cycle')
        .attr('x', 20)
          .attr('y', 1);
    }
    // Add line-controller to chart.
    this.chartContainer.append("g")
      .attr("class", "line-controller")
      .attr("id", this.id)
      .append("line")
      .attr("x1", 0)
      .attr("x2", this.width)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", 3)
      .attr("stroke", "black")
      .style("cursor" , "ns-resize")
      .call(d3.behavior.drag().on("drag", $.proxy(_this.move, _this)))
      .on("mousedown" , function () {
          d3.event.stopPropagation();
      });
  };

  LifetimeChartElement.prototype.rightClickLeftChart = function () {
    // Declare variable to hold position x and y when right click
    var x,y;
    var _this = this;
    if (d3.event.pageX || d3.event.pageY) {
        x = d3.event.pageX;
        y = d3.event.pageY;
    } else if (d3.event.clientX || d3.event.clientY) {
        x = d3.event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = d3.event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    // Show context menu
    d3.select(this.menu_id)
            .style('position', 'absolute')
            .style('top', y + 'px')
            .style('left', x + 'px')
            .style('display', 'block');

    // Hide context menu when click out side
    $(document).bind("click keyup", function(event) {
        d3.select(_this.menu_id).style('display', 'none');
    });
    var chartId = this.chartId;
    // Set event listener for item of context menu
    d3.select(this.menu_id)
            .selectAll("li")
            .on("click", function (d, i) {
                if (i === 0) {
        d3.select(_this.menu_id).style('display', 'none');
                    //_this.transit.Transit(_this.srcChart, _this.dstChart, chartId);

                }
            });

    // Prevent default right click
    d3.event.preventDefault();
  }

  LifetimeChartElement.prototype.onClickName = function () {
      //this.transit.Transit(this.srcChart, this.dstChart, this.chartId);
  };

  /**
   * Move all chartId and resize if need
   */
  LifetimeChartElement.prototype.move = function (){
      var a = $(this.chartContainer[0][0]).find(".line-controller");
      var line = $(a[0]).find("line");
      var currentY = parseFloat($(line[0]).attr("y1"));
      var dy = d3.event.dy;
      if (this.height - d3.event.dy < 5) {
          dy = this.height - 5;
      }

      this.height -= dy;

      $(line[0]).attr("y1", currentY + dy);
      $(line[0]).attr("y2", currentY + dy);
      this.moving = this.heightFixed - this.height;
      reSizeVariable(this.chartType, this.moving, this.idxId);
  };

  /**
   * Apply resizing to all chartId chart in main chart
   * @param {type} move value that each chart need move
   * @param {type} id id of chart want to rezie
   */
  function reSizeVariable(chartType, move, id) {
      for (var i = 0 ; i <= id; i++) {
          var moving = cumMoveVariable(chartType, i);
          var globalCharts = (chartType === 'for_variables') ? globalChartsVLCV : globalChartsVLCF;
          globalCharts[i].reSize(moving);
      }
  }

  /**
   * Apply resizing to one chart
   * @param {type} move value that each chart need move
   */
  LifetimeChartElement.prototype.reSize = function(move) {
    this.yScale.range([this.height, 0]);
    if (this.chartType === 'for_variables') {
      this.yScaleLeftChart
        .range([this.height, 0]);
    }

    var yScale = this.yScale;
    this.line.y(function(d) {return yScale(d.y);});
    var lineScale = this.line;
    this.clipPath.attr("height", this.height);
    this.chartContainer.selectAll("path.line-free").attr("d", lineScale).attr("transform", "translate(0, " + (move + this.moving) + ")");
    this.chartContainer.selectAll("path.line-rw").attr("d", lineScale).attr("transform", "translate(0, " + (move + this.moving) + ")");
    this.chartContainer.selectAll("path.line-left").attr("d", this.lineLeftChart).attr("transform", "translate(-120, " + (move + this.moving) + ")");
    this.chartContainer.selectAll("text.y-name").attr("y", move + this.moving + this.height/2 - 30);


    var a = $(this.chartContainer[0][0]).find(".line-controller");
    var line = $(a[0]).find("line");
    $(line[0]).attr("y1", move + this.moving);
    $(line[0]).attr("y2", move + this.moving);
  };

  /**
   * Compute move value that each chart moved
   * @param {type} id id of before chart has moved
   * @returns {Number}
   */
  function cumMoveVariable(chartType, id) {
    var sum = 0;
    var globalCharts = (chartType === 'for_variables') ? globalChartsVLCV : globalChartsVLCF;

    for (var i = id + 1; i < globalCharts.length; i++) {
        sum += globalCharts[i].moving;
    }
    return sum;
  }



  /**
   * Show tooltip when moveover in leftchart
   */
  LifetimeChartElement.prototype.showTooltip = function (iChartData, chartId) {
    d3.select(chartId).attr("stroke", "black");
    var content = "";
    content += "<span class=\"name\">Start Cycle : </span><span class=\"value\"> " + iChartData.startX + "</span><br/>";
    content += "<span class=\"name\">End Cycle : </span><span class=\"value\"> " + iChartData.endX + "</span><br/>";
    return this.tooltip.showTooltip(content, d3.event);
  };

  /**
   * Hide tooltip when moveover out leftchart
   */
  LifetimeChartElement.prototype.hideTooltip = function (data, i, chartId) {
    return this.tooltip.hideTooltip();
  };


  /**
  * Re-draw main chart with new domain for x axis
  * @param {type} b : new domain
  */
  LifetimeChartElement.prototype.scaleXAxis = function(b){
    this.xScale.domain(b);
    this.chartContainer.selectAll(".line-free").attr("d", this.line);
    this.chartContainer.selectAll(".line-rw").attr("d", this.line);
    this.chartContainer.select(".x.axis").call(this.xAxis);
  };

  /**
  * Re-draw main chart with new domain for y axis
  * @param {type} b : new domain
  */
  LifetimeChartElement.prototype.scaleYAxis = function(b){
    this.yScale.domain(b);
    this.chartContainer.selectAll(".line").attr("d", this.line);
    this.chartContainer.select(".y.axis").call(this.yAxis);
  };
   return LifetimeChartElement;
});