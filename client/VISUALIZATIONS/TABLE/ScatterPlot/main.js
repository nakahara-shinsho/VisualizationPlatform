define(["css!./main"], function () {
  /**
   * Constructor
   * @class ScatterPlot
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {ScatterPlot}
   */
  var ScatterPlot = function (io) {
    this.io = io;
    
    //set default to highligh mode
    if(!this.io.isHighlightMode() && !this.io.isDrilldownMode()) {
      this.io.setHighlightMode();
    }
    
    this.io.dataManager().setMapperProps({
      xaxis: { label: 'X Axis', type: 'number', map2: '', spk: 'width'}, //spk--space primary key
      yaxis: { label: 'Y Axis', type: 'number', map2: '', spk: 'height'} 
    });
  };
  
  /**
   * update chart according with changed of interface variables
   * @method ScatterPlot
   * @memberOf ScatterPlot
   * @returns {ScatterPlot}
   */
  ScatterPlot.prototype.update = function (changed) {
    var self = this;
    if (changed.hasOwnProperty("COLOR_MANAGER")) {
      this.redraw();
    }
    else if (changed.hasOwnProperty("DESIGN_MANAGER")) {
      this.redraw();
    }
    else if (changed.hasOwnProperty("DATA_MANAGER")) {
      this.redraw();
    } else {
      this.redraw();
    }
    
    return this.svg_dom;
  };
  
    /**
     * render Scatter Matrix Chart
     * @method render
     * @memberOf ScatterPlot
     */
  ScatterPlot.prototype.render = function (containerWidth, containerHeight) {
     // initialize
     this.initialize(containerWidth, containerHeight);
     // create chart header
     this.createChartHeader();
     // create scatter matrix chart
     this.drawScatterPlot();
     
     return this.svg_dom;
  } ;
  
  ScatterPlot.prototype.redraw = function() {
     this.deleteContentElements();
     this.drawScatterPlot();
  };
  
  /**
   * initialize
   * @method initialize
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.initialize = function (containerWidth, containerHeight) {
    
    this.width  = containerWidth;
    this.height = containerHeight;
    
    // init margin
    this.margin = {left: 40, top: 10, right: 20, bottom: 40 };
    
    // Scales
    this.x = d3.scale.linear();
    this.y = d3.scale.linear();
    this.xAxis = d3.svg.axis().scale(this.x).orient("bottom").ticks(5);
    this.yAxis = d3.svg.axis().scale(this.y).orient("left").ticks(5);
  
    this.brushCell = null;

    this._mode = "highlight"; //drilldown
  };
 
   /**
   * remove current svg and reset data to draw other type of chart
   * @method params
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.deleteContentElements = function () {
    var self = this;
    //clear brush
    self.brushCell = null;
    
    //clear all content
    while (self.svg_dom.firstChild) {
        self.svg_dom.removeChild(self.svg_dom.firstChild);
    }

    self.svg = d3.select(self.svg_dom);
  };

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.createChartHeader = function () {
    var self = this;
   
    if(self.svg_dom) {
        this.deleteContentElements();
    } else {
        self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
        self.svg =  d3.select(self.svg_dom)
          .attr('class', 'scatterplot')
        .append("g")
          .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
    }
  };
  
  /**
   * draw scatter matrix chart depend on selected items by user
   * @method drawScatterPlot
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.drawScatterPlot = function () {
    var self = this,
        colorManager = this.io.colorManager(),
        dataManager = this.io.dataManager(),
        data = dataManager.getFilteredRows(),
        xcolumn = dataManager.getMapper('xaxis'),
        ycolumn = dataManager.getMapper('yaxis'),
        filteredRows = dataManager.getFilteredRows();

    if(filteredRows.length <=0 || _.isEmpty(xcolumn) || _.isEmpty(ycolumn))  return;
    
    this.x.range([0,  this.width]).domain(dataManager.getFilteredDataRange(xcolumn, filteredRows));
    this.y.range([this.height, 0]).domain(dataManager.getFilteredDataRange(ycolumn, filteredRows));
    
    //define brush
    this.brush =d3.svg.brush()
      .x(self.x)
      .y(self.y)
      .on("brushstart", function () {
        self.brushstart(self, this, xcolumn, ycolumn);
      })
      .on("brush", function () {
        self.brushmove(self, xcolumn, ycolumn);
      })
      .on("brushend", function () {
        self.brushend(self, xcolumn, ycolumn);
      });
      
    //draw frame to brush
    var brushframe = self.svg.append("rect")
      .attr("class", 'frame')
      .attr("x", 0)
      .attr("y", 0)
      .attr("width",  this.width)
      .attr("height", this.height)
      .call(self.brush).on("mousedown", function () {
        d3.event.stopPropagation();
      });
    
    //draw axises
    this.drawAxis(xcolumn, ycolumn);
    
     // draw dots
     this.svg.selectAll("circle")
       .data(data)
       .enter()
     .append("circle")
      .attr("cx", function (d) {
        return self.x(+d[xcolumn]);
      })
      .attr("cy", function (d) {
        return self.y(+d[ycolumn]);
      })
      .attr("r", 3)
      .style("fill", function (d) {
        return colorManager.getColorOfRow(d);
      });
      
    
    //hide unfocused data for highligh mode
    if(this.io.isHighlightMode()) {
      this.svg
        .selectAll("circle")
        .classed("hideme", function (row) {
           return !dataManager.isHighlightRow(row);
        });
    }
  };
  
  /**
   * For draw axis X, Y
   * @method drawAxis
   * @memberOf ScatterPlot
   * @returns {undefined}
   */
  ScatterPlot.prototype.drawAxis = function (xcolumn, ycolumn) {
    var self = this;
     
    // draw X axis
    this.svg
      .append("g")
      .attr("transform", "translate(0,"+ self.height +")" )
      .attr("class", "x axis")
      .call(self.xAxis)
    .append('text')
      .attr('x',self.width/2)
      .attr('y',self.margin.bottom)
      .text((xcolumn)? xcolumn:'X');
    
    // draw Y axis
    this.svg
      .append("g")
      .attr("class", "y axis")
      .call(self.yAxis)
    .append("text")
      .attr("transform", "translate("+ (-self.margin.left) +',' + self.height/2 +") rotate(-90)")
      .text((ycolumn)?ycolumn:"Y");
};

  /**
   * Clear the previously-active brush, if any.
   * @method brushstart
   * @param {type} p
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.brushstart = function (chart, frame, xcolumn, ycolumn) {  
    d3.select(frame).call(chart.brush.clear());
    d3.event.sourceEvent.stopPropagation();
   };

  /**
   * Highlight the selected circles.
   * @method brushmove
   * @param {type} p
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.brushmove = function (chart, xcolumn, ycolumn) {
    var e = chart.brush.extent();
    chart.svg.selectAll("circle").classed("hideme", function (d) {
        return e[0][0] > +d[xcolumn] || +d[xcolumn] > e[1][0] || e[0][1] > +d[ycolumn] || +d[ycolumn] > e[1][1];
    });
  };

  /**
   * If the brush is empty(no selection), show (restore) all circles.
   * @method brushend
   * @memberOf ScatterPlot
   */
  ScatterPlot.prototype.brushend = function (chart, xcolumn, ycolumn) {
    var filterset = {},
        mappedColumns = chart.io.dataManager().getMappedColumns();
    
    d3.event.sourceEvent.stopPropagation();
     
    mappedColumns.forEach(function(column) {
        if(!_.has(filterset, column)){
           filterset[column] = null;
        }
    });

    if (chart.brush.empty()) {
       chart.io.dataManager().setRowRefiner(filterset); //clear refiner of all visible columns 
    }
    else {
        var e = chart.brush.extent(),
            selector = chart.io.dataManager().getColumnRefiner();
        if(xcolumn == ycolumn) {
            filterset[xcolumn]= [Math.max(e[0][0], e[0][1]), Math.min(e[1][0], e[1][1])];
        } else {
            filterset[xcolumn]= [e[0][0], e[1][0]];
            filterset[ycolumn]= [e[0][1], e[1][1]];
        }
        chart.io.dataManager().setRowRefiner(filterset);
        
        //if(!chart.io.isHighlightMode()) {
            //set the current columns into selector
        //    chart.io.dataManager().setColumnRefiner([p.x, p.y]);
        //}
    }
  };

  ScatterPlot.prototype.updateColors = function() {
     var colorManager = this.io.colorManager();
     this.svg.selectAll("circle")
      .style("fill", function (d) {
        return colorManager.getColorOfRow(d);
      });
  };
  
  return ScatterPlot;
});
