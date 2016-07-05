/**
 * @fileOverview implement for LineChart
 */

/**
 * Create LineChart main function
 * @class LineChart
 * @param {type} AxisSelectable AxisSelectable class
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {LineChart}
 */
define(["util/AxisSelectable",
        "util/tooltip/OldTooltip",
        "text!./control.html",
        "css!./LineChart"], function (AxisSelectable, CustomTooltip, designTpl) {
  /**
   * Constructor create LineChart
   * @class LineChart
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {LineChart}
   */
  var LineChart = function (io) {
    this.io = io;

    //set default to highligh mode
    if(!this.io.isHighlightMode() && !this.io.isDrilldownMode()) {
      this.io.setHighlightMode();
    }
    
    //higher priority for set initial io variable values from template
    this.io.designManager().setTemplate(designTpl);
    this.io.dataManager().setMapperProps({
      xaxis: {type: 'number', label: 'X axis', map2: '', spk: 'width' },
      yaxis: {type: 'number', label: 'Y axis', map2: [] }
    });
    
    this.io.designManager().setControl("graphType", 
        {type:"radio", name:"Graph Type", range:["stacked", "grouped","normalized"]}); 

  };
  
  /**
   * update chart according with changed of interface variables
   * @method LineChart
   * @memberOf LineChart
   * @returns {LineChart}
   */
  LineChart.prototype.update = function (changedAttr) {
    var self = this;
    
    // if _CHART_ changed
    if(changedAttr.hasOwnProperty("DATA_MANAGER")   || 
       changedAttr.hasOwnProperty("DESIGN_MANAGER")　|| 
       changedAttr.hasOwnProperty("COLOR_MANAGER") 
      ) {
      this.redraw();
    } else  {//MODE change
        this.redraw();
    }
    
  };
  
   LineChart.prototype.redraw = function() {
     this.deleteExistingElements();
     this.drawLineChart();
  };
 
  /**
   * render Line Chart
   * @method render
   * @memberOf LineChart
   */
  LineChart.prototype.render = function (containerWidth, containerHeight) {
      
    // initialize
    this.initialize(containerWidth, containerHeight);    
    // create chart header
    //this.createChartHeader();
    // create line chart
    this.drawLineChart();
    
    return this.svg_dom;
    
  };
  /**
   * initialize
   * @method initialize
   * @memberOf LineChart
   */
  LineChart.prototype.initialize = function (containerWidth, containerHeight) {
    // set default value for checkbox
    this.defaultCheckbox = false;
    // define width and height of drawing area
    this.margin = {top: 20, right: 40, bottom: 40, left: 40};
    
    // set width, height
    this.width  = containerWidth - this.margin.right - this.margin.left;
    this.height = containerHeight - this.margin.top - this.margin.bottom;
    // set for legend
    this.legendSize = 290;
    

    // init for others
    this.maxXValue = 0;
    this.minXValue = 0;
   
    this.line = null;
  
    this.svg_g = null;
    this.svg = null;
    this.tooltip = new CustomTooltip("tooltip", 200);

    // set for scales
    this.x = d3.scale.linear().range([0, this.width]);
    this.y = d3.scale.linear().range([this.height, 0]);
    this.xAxis = d3.svg.axis().scale(this.x).orient("bottom");
    this.yAxis = d3.svg.axis().scale(this.y).orient("left");

    this.createChartHeader();

  };


  /**
   * Convert received data to understandable data format for this chart
   * @method transformData
   * @memberOf LineChart
   */
  LineChart.prototype.transformData = function () {
    var self = this, linesData=[];
    
    var ycols = self.io.dataManager().getMapper('yaxis'),
        xcol = self.io.dataManager().getMapper('xaxis'),
        data = self.io.dataManager().getData();
    
    if(_.isEmpty(ycols) || _.isEmpty(xcol) || _.isEmpty(data)) return linesData;

    //filtered data
    if(self.io.isDrilldownMode()) { 
        data = self.io.dataManager().getFilteredRows(); 
    }
    
    // filter max x value
    self.maxXValue = d3.max(data.map(function (d) {
      return +(d[xcol]);
    }));
    
    // filter min x value
    self.minXValue = d3.min(data.map(function (d) {
      return +(d[xcol]);
    }));
    
    // sorting x axis data for line chart
    data.sort(function(rowa, rowb) {
       return +rowa[xcol] > +rowb[xcol] ? 1 : -1;
    });
       
    // set data to draw chart
    ycols.forEach(function (key) {    
      //set all y data
      var line={name: key};
      line.values = data.filter(function(row){
          return row[key] !== undefined || !isNaN(row[key]);
      }).map(function (row) {
          return {xval:+row[xcol], yval: +row[key]};
      });
      
      linesData.push(line);
    });
    
    
    self.setAxisesDomain(data, linesData);

    return linesData;
  };


    /**
     * create header of chart
     * @method createChartHeader
     * @memberOf LineChart
     */
   LineChart.prototype.createChartHeader = function () {
      var self = this;
      
      self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
      // create svg
      self.svg =  d3.select(self.svg_dom)
        .attr('class', 'linechart')
        .attr("width", self.width)
        .attr("height", self.height);
        
      self.svg_g = self.svg
        .append("g")
        .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
      
   };

  /**
   * draw normal line chart if number of selected item is 1 or more than 1
   * @method params
   * @memberOf LineChart
   */
   LineChart.prototype.drawLineChart = function () {
    var self = this;
       
    var ycols =  self.io.dataManager().getMapper('yaxis');
    
    var linesData = this.transformData();
    
    
    self.line = d3.svg.line()
      .interpolate("linear ")
      .x(function (d) {
        return self.x(d.xval);
      })
      .y(function (d) {
        return self.y(d.yval);
      });
    
    // create chart
    var labels = self.svg_g.selectAll(".gline")
      .data(linesData)
      .enter().append("g")
      .attr("class", "gline")
      .attr('id', function (d, i) {
        return d.name.replace(/ /g, "_");
      });
    
    var colorManager = self.io.colorManager();
    labels.append("path")
      .attr("id", function (d) {
        return "line_" + d.name.replace(/ /g, "_");
      })
      .attr("class", "line")
      .attr("d", function (d) {
        return self.line(d.values);
      })
      .style("stroke", function (d) {
        return colorManager.getColorOfColumn(d.name);
      })
      .on("click", function(d) {
        if (d3.event.ctrlKey) {
          self.io.dataManager().setControl(d.name, d3.event);
        }
      });
    
    //self.drawTooltips();
    
    self.drawAxises();
   
    self.drawBrush();
    
    //self.drawLegend();
  };

  LineChart.prototype.drawBrush = function(){
   var self = this, 
       dataManager = this.io.dataManager(),
       xcol = dataManager.getMapper('xaxis');

   var brushmove = function(){
       //brushend();
   };

   var brushend = function(){
      d3.event.sourceEvent.stopPropagation();
      var filter = {};
      filter[xcol] = brush.empty() ? null : brush.extent();
      dataManager.setRowRefiner(filter);
      if(!self.io.isHighlightMode())
      {
        self.svg_g.call(brush.clear()); //clear the selected range of brush
      }
   };
   
   var brush = d3.svg.brush() //create recttangle brush
         .x(self.x)
         .on("brushstart", function(){
           d3.event.sourceEvent.stopPropagation();
           //self.svg_g.selectAll(".brush").call(brush.clear());
         })
         .on("brush",    brushmove)
         .on("brushend", brushend);
   
   if(!self.io.isHighlightMode()) {
         self.svg_g.selectAll(".brush").call(brush.clear());
   }
   
   //define(draw/append) brush
   var brushg = self.svg_g.append('g')
     .attr("class","x brush")
     .call(brush);
   
  brushg.selectAll("rect")
     .attr("height", self.height);

  /*
  brushg.selectAll(".resize").append("path")
    .attr("transform", "translate(0," +  self.height / 2 + ")")
    .attr("d", arc);
 */

  if(self.io.isHighlightMode()) {
    //show the actual range 
    var xrange = dataManager.getRowRefiner(xcol);
    if(!_.isEmpty(xrange)) {
     self.svg_g.selectAll(".brush").call(brush.extent(xrange));
    }
  } else {
    //clear the full range
     self.svg_g.selectAll(".brush").call(brush.clear());
  }

 };


  /**
   * draw X axis, Y axis for chart
   * @method params
   * @memberOf LineChart
   */
  LineChart.prototype.drawAxises = function () {
    var self = this;
    
    // init for X axis
    var  xAxis = d3.svg.axis()
      .scale(self.x)
      .orient("bottom").ticks(5).tickSize(10);
      
    // init for Y axis
    var  yAxis = d3.svg.axis()
      .scale(self.y)
      .orient("left").ticks(5).tickSize(10);
    
    // create X axis
    self.svg_g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + self.height + ")")
      .call(xAxis)
     .append('text')
       .attr('class', 'xlabel')
       .attr('x', self.width)
       .attr('y', -6)
       .style('text-anchor', 'end')
       .text(self.io.dataManager().getMapper('xaxis'));
    
    // create Y axis
    self.svg_g.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append('text')
      .attr('class', 'ylabel')
      .attr("transform", "rotate(-90)")
      .attr('y', 6)
      .attr("dy", ".71em")
      .style('text-anchor', 'end')
      .text(self.io.designManager().getValue('ylabel'))
      .on("click", function() {
        self.io.designManager().setControl('ylabel', d3.event);
      });
  };


  /**
   * get domain value for X, Y axis
   * @method setAxisesDomain
   * @memberOf LineChart
   */
  LineChart.prototype.setAxisesDomain = function (data, linesData) {
    var self = this,
        ret  = {};
    
    // set domain for X axis
    var xcol = this.io.dataManager().getMapper('xaxis'),
    xDomain = d3.extent(data, function (d) {
            return +d[xcol];
    });
    this.x.domain(xDomain);     
    
    // set domain for Y axis
    var yMin = d3.min(linesData, function (line) {
                var values= line.values.map(function(d) {return d.yval;});
                return d3.min(values);
              });
    var yMax = d3.max(linesData, function (line) {
                var values= line.values.map(function(d) {return d.yval;});
                return d3.max(values);
              });
     
    this.y.domain([yMin, yMax]);    
  };
  
  
  /**
   * Show tooltip when mouseover
   * @param {string} name - name of element which on mouseover
   * @param {string} value - value of element which on mouseover
   * @method showTooltip
   * @memberOf LineChart
   */
  LineChart.prototype.showTooltip = function (name, value) {
    var content = "<span class=\"name\">Name: </span>" + name + "<br/><span class=\"value\"> Value: </span>" + value;
    return this.tooltip.showTooltip(content, d3.event);
  };
  /**
   * Hide tooltip when mouseout
   * @method hideTooltip
   * @memberOf LineChart
   */
  LineChart.prototype.hideTooltip = function () {
    return this.tooltip.hideTooltip();
  };
  /**
   * Display context menu for Line chart
   * @method rightclick
   * @memberOf LineChart
   */
  LineChart.prototype.rightclick = function () {
    var self = this,
      // Declare variable to hold position x and y when right click
      x, y;
    if (d3.event.pageX || d3.event.pageY) {
      x = d3.event.pageX;
      y = d3.event.pageY;
    } else if (d3.event.clientX || d3.event.clientY) {
      x = d3.event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      y = d3.event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    
    // Show context menu
    d3.select("#linechart-menu").style('position', 'absolute')
      .style('top', y + 'px')
      .style('left', x + 'px')
      .style('display', 'block');
    // Prevent default right click
    d3.event.preventDefault();
    // Hide context menu when click out side
    $(document).bind("click keyup", function (event) {
      d3.select("#linechart-menu").style('display', 'none');
    });
    // Set event listener for item of context menu
    d3.select("#linechart-menu")
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

  /**
   * remove current svg and reset data to draw other type of chart
   * @method params
   * @memberOf LineChart
   */
  LineChart.prototype.deleteExistingElements = function () {
    var self = this;
    // delete existing elements of svg before redraw
    if(self.svg_g) {
      self.svg_g.remove();
    }
    // reset svg
    self.svg_g = self.svg.append("g")
      .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
  };

  return LineChart;
});
