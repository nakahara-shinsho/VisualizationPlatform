  /**
   * Draw a main chart
   * @param {type} options
   * @returns {Chart}
   */

define(function() {
  /**
   * Constructor
   * @class VariableAccessPatternChartElement
   * @param {Object} options - options which contain all data for create chart element
   * @param {Object} options.data - data for create element
   * @param {number} options.width - width of element
   * @param {number} options.height - height of element
   * @param {number} options.startCycle - start cycle
   * @param {number} options.endCycle - end cycle
   * @param {number} options.maxAccessFrequency - max frequency
   * @param {number} options.minAccessFrequency - min frequency
   * @param {Element} options.svg - svg tag
   * @param {string} options.id - id of element
   * @param {string} options.name - name of element
   * @param {number} options.margin - margin of element
   * @param {boolean} options.showBottomAxis - whether show booton axis or not
   * @param {string} options.color - color of element
   * @returns {VariableAccessPatternChartElement}
   */
  var ChartElement= function(options) {
    var currentChart        = this;
    this.moving             = 0;
    this.chartData          = options.data;
    this.width              = options.width;
    this.height             = options.height;
    this.defaultRowHeight   = options.height;
    this.startCycle         = options.startCycle;
    this.endCycle           = options.endCycle;
    this.maxAccessFrequency = options.maxAccessFrequency;
    this.minAccessFrequency = options.minAccessFrequency;
    this.svg                = options.svg;
    this.id                 = options.id;
    this.name               = options.name;
    this.margin             = options.margin;
    this.showBottomAxis     = options.showBottomAxis;
    this.color              = options.color;

    // Create range and domain scale for x axis
    this.xScale = d3.scale.linear()
      .range([0, this.width])
      .domain([this.startCycle, this.endCycle]);

    // Create range and domain scale for y axis
    this.yScale = d3.scale.linear()
        .range([this.height,0])
        .domain([this.minAccessFrequency, this.maxAccessFrequency]);

    this.yScaleClipPath = d3.scale.linear().range([this.height, 0]).domain([this.height, 0]);

    // Create local xScale and yScale
    var xS = this.xScale;
    var yS = this.yScale;

    // Create line to draw on chart
    this.line = d3.svg.line()
      .x(function (d) { return xS(d.x); })
      .y(function (d) { return yS(d.z);})
      .interpolate("step-after");

    // Creates a mask. If this wasn't here, when we zoom/panned,
    // we'd see the chart go off to the left under the y-axis

    this.clipPath = this.svg.append("defs").append("clipPath")
      .attr("id", "clip-" + this.id)
      .append("rect")
      .attr("id", "clip-rect" + this.id)
      .attr("width", this.width)
      .attr("height", this.yScaleClipPath(this.height));

    // Create space to draw chart
    this.chartContainer = this.svg.append("g")
      .attr('class',this.name.toLowerCase())
      .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + (this.height * this.id) + (this.id)) + ")");

    // Map data to display chart
    this.chartContainer.append("path")
      .data([this.chartData])
      .attr("class", "line")
      .attr("id", function(d) {
        return "access_pattern_" + currentChart.name;
      })
      .attr("clip-path", "url(#clip-" + this.id + ")")
      .attr("d", this.line)
      .attr("transform", "translate("+ this.margin.left +",0)")
      .style("stroke", currentChart.color);

    // Create x axis
    this.xAxisBottom = d3.svg.axis().scale(this.xScale).orient("bottom");

    // Add name of y axis
    if (this.id === 0) {
      this.chartContainer.append("g")
        .append("text")
        .attr("class", "instructions")
        .attr("transform", "translate("+ (-this.margin.left/3) +","+ (-this.margin.top/2) +")")
        .text("Variables");
    }
    // Add line-controller to chart.
    this.chartContainer.append("g")
      .attr("class", "line-controller")
      .append("line")
      .attr("transform", "translate("+ this.margin.left +",0)")
      .attr("x1", 0)
      .attr("x2", this.width)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", 3)
      .attr("stroke", "black")
      .style("cursor" , "ns-resize")
      .call(d3.behavior.drag().on("drag", $.proxy(currentChart.move, currentChart)))
      .on("mousedown", function () {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      });

    // Only want a bottom axis on the last chart */
    if(this.showBottomAxis){
        this.chartContainer.append("g")
          .attr("class", "x axis bottom")
          .attr("transform", "translate(" + this.margin.left + "," + (this.height) + ")")
          .call(this.xAxisBottom);
    }
    // Create y axis
    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(5);

    // Add y axis to chart
    this.chartContainer.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate("+ this.margin.left + ",0)")
      .call(this.yAxis);

    // Add name of variable to y axis
    this.chartContainer.append("text")
      .attr("class","variable-name")
      .attr("transform", "translate(" + 0 + "," + this.height / 2 + ")")
      .text(this.name);
  };

  /**
  * Function to show a part correlative with user control
  * @param {type} b : domain after span control
  * @memberOf VariableAccessPatternChartElement
  */
  ChartElement.prototype.showOnly = function(b){
    this.xScale.domain(b);
    this.chartContainer.select("path").data([this.chartData]).attr("d", this.line);
    this.chartContainer.select(".x.axis.bottom").call(this.xAxisBottom);
  };

  /**
   * Function to scale chart when move bound line
   * @memberOf VariableAccessPatternChartElement
   */
  ChartElement.prototype.move = function () {
    var a = $(this.chartContainer[0][0]).find(".line-controller");
    var line = $(a[0]).find("line");
    var currentY = parseFloat($(line[0]).attr("y1"));
    var dy = d3.event.dy;

    if(this.height - d3.event.dy < 5) {
      dy = this.height - 5;
    }

    this.height -= dy;

    $(line[0]).attr("y1", currentY + dy);
    $(line[0]).attr("y2", currentY + dy);

    this.moving = this.defaultRowHeight - this.height;

    reSize(this.moving, this.id);
  };

  /**
   * Function to resize chart
   * @memberOf VariableAccessPatternChartElement
   */
  ChartElement.prototype.reSize = function(move, size) {
    this.yScale.range([this.height,0]);
    this.chartContainer.selectAll("path.line").attr("d", this.line).attr("transform", "translate("+ this.margin.left +", " + (move + this.moving) + ")");
    this.chartContainer.select(".y.axis").call(this.yAxis).attr("transform", "translate("+ this.margin.left + ", " + (move + this.moving) + ")");
    this.chartContainer.select(".y.axis path.domain").call(this.yAxis).attr("transform", "translate("+ 0 + ", " + 0 + ")");

    this.yScaleClipPath.range([this.height, 0]);
    this.clipPath.attr("height", this.yScaleClipPath(this.defaultRowHeight));

    var a = $(this.chartContainer[0][0]).find(".line-controller");
    var line = $(a[0]).find("line");

    $(line[0]).attr("y1", move + this.moving);
    $(line[0]).attr("y2", move + this.moving);
  };

  /**
   * Resize chart
   * @private
   * @memberOf VariableAccessPatternChartElement
   */
  function reSize(move, id) {
    for (var i = 0 ; i <= id; i++) {
      var moving = cumMove(i);
      globalChartsVAPM[i].reSize(moving, 0);
    }
  }

  /**
   * Calculate moving area
   * @private
   * @memberOf VariableAccessPatternChartElement
   */
  function cumMove(id) {
    var sum = 0;
    for (var i = id + 1; i < globalChartsVAPM.length; i++) {
      sum += globalChartsVAPM[i].moving;
    }
    return sum;
  }
  return ChartElement;
});