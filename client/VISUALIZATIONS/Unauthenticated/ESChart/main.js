/**
 * @fileOverview implement for ESChart 
 * @author 
 * @version 1.0
 * @copyright 
 */
/** @module ESChart*/
/**
 * Create ESChart main function
 * @class ESChart
 * @param {type} AxisSelectable AxisSelectable class
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {ESChart}
 */
define(["css!./ESChart"], function () {
  /**
    * Constructor create ESChart
    * @method ESChart
    * @memberOf ESChart
    * @returns {ESChart}
    */
  var ESChart = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.setValue({
      timeRange  : [0, 0],
    });
    
    var mainMargin   =  {top: 20, right: 20, bottom: 50, left: 20}, // bottom = 200 + 20
        sliderMargin =  {top: 360, right: 20, bottom: 20,  left: 20};
    
    this.drawWidth = 800;
    this.drawHeight= 400;
    this.synChartId = 0; //initial screen ID value
    
    //define width, height of drawing area
    this.mainWidth  = this.drawWidth  - mainMargin.right - mainMargin.left;
    this.mainHeight = this.drawHeight - mainMargin.top   - mainMargin.bottom;
    this.mainPosition = {left: mainMargin.left, top: mainMargin.top};
    
    this.sliderWidth  = this.drawWidth  - sliderMargin.right - sliderMargin.left;
    this.sliderHeight = this.drawHeight - sliderMargin.top   - sliderMargin.bottom;
    this.sliderPosition = {left: sliderMargin.left, top: sliderMargin.top};
    
    //define x scale and y scale
    this.mainx  = d3.scale.linear().rangeRound([0, this.mainWidth]);
    this.lengthx = d3.scale.linear().rangeRound([0, this.mainWidth]);
    this.sliderx = d3.scale.linear().rangeRound([0, this.sliderWidth]);
    
    //
    this.section = 1;
  };

  //called from PF for the first time
  ESChart.prototype.getChartOptions = function(){
     return {_width_:  this.mainWidth, _remove_: true,
             _section_: this.section,  _syn_chart_id_: this.synChartId++ };
  };
  
  /**
   * render Line Chart
   * @method render
   * @memberOf ESChart
   */
  ESChart.prototype.render = function (containerWidth, containerHeight) {
    

    this.width = containerWidth;
    this.height = containerHeight;
    
    // validate data
    if (this.validate()) {
      // initialize chart
      this.initialize(containerWidth, containerHeight);
      
      // create  chart
      this.drawChart();
      
      // create sliderbar
      this.renderSlider(containerWidth, containerHeight);
      
      //draw main x axis
      this.zoom.x(this.mainx);
      this.mainXAxis.call(d3.svg.axis().scale(this.mainx).orient("top"));

      return this.svg_dom;
      
    }
    else {
      alert('Data error!');
      return null;
    }
  };
   
  /**
    * update chart according with changed of interface variables
    * @method update
    * @memberOf ESChart
    * @returns {ESChart}
    */
  ESChart.prototype.update = function (changedAttr) {
    var self = this;
    //update chart
    return self;
  };

    
  ESChart.prototype.drawChart = function (delFlag) {
    var currentData = this.io.data;
    
      // create  chart
      if(currentData.operable){
        this.renderOperableData(delFlag);
      }
    
      if(currentData.unoperable) {
        this.renderUnoperableData(delFlag);
      }
    
      //zoom-in factor
      var visibleRange = currentData.timeRange,
          overviewRange = currentData.overviewRange,
          factor=d3.round((overviewRange[1]-overviewRange[0])/(visibleRange[1]-visibleRange[0]), 2);
      //console.log("zoom-in factor= " + factor);
      this.sliderView.select(".zoom-factor").text("zoom-in factor="+factor);
  }
    
  ESChart.prototype.renew = function(delFlag){
    
    var data = this.io.data;
    var updatingChartId = this.synChartId-1;
    if( updatingChartId == data.synChartId) {
      this.drawChart(delFlag);

      //check whether all data have been received, if not, trigger new renew
      if(data.sectionRange[1] < data.timeRange[1]){
          var start = data.sectionRange[1];
          var end   = Math.min(start + (data.timeRange[1]-data.timeRange[0])/this.section,
                               data.timeRange[1]);
          //var section_width=this.mainWidth/this.section;
          var section_width=this.mainWidth*(end-start)/(data.timeRange[1]-data.timeRange[0]);
          if(section_width >=1){
            this.io.renewTrigger({ _width_: section_width, _remove_: false, _section_: this.section,
                          _sectionRange_:[start, end] , _syn_chart_id_: updatingChartId});
          }
        }//if end
    }//if end
  };
  
  /**
  * This function will validate input data for drawing chart. 
  * If data is validate, chart will be drawn.
  * @returns {Boolean}
  */
  ESChart.prototype.validate = function () {
      var isValidate = false;
      // For CSV Data
      var currentData = this.io.data;
      isValidate = currentData && currentData.overviewRange ;
      return isValidate;
  };
  
     /**
   * initialize
   * @method initialize
   * @memberOf ESChart
   */
  ESChart.prototype.initialize = function (containerWidth, containerHeight) {
    
    var self = this;
    
    self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
    
    //create svg
    var svg =  d3.select(self.svg_dom)
              .attr('class', 'eschart')
              .attr("viewBox", '0, 0, ' + this.drawWidth + ', ' + this.drawHeight)
              .attr("preserveAspectRatio", 'none');
    

    this.sliderView = svg
        .append("g")
        .attr("transform", "translate(" + this.sliderPosition.left + "," 
              + this.sliderPosition.top + ")")
        .on("mousedown" , function () {
            d3.event.stopPropagation();
        });
    
    //text --zoom factor
    this.sliderView.append("text")
        .attr("class", "zoom-factor")
        .attr("x", this.sliderWidth/3)
        .attr("y", this.sliderHeight*2/3)
        .attr("dy", ".01em")
        .text("(default) zoom-in factor = 1");
    
    //create tooltip
    this.tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("color", 'yellow');//text color
    
    var mainView = svg
        .append("g")
        .attr("transform", "translate(" + this.mainPosition.left + "," 
              + this.mainPosition.top + ")")
        .on("mousedown" , function () {
            d3.event.stopPropagation();
        });

    var clip = mainView.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("id", "clip-rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", this.mainWidth)
        .attr("height", this.mainHeight);

     // create X axis
    //self.sliderx.domain(range);
    var xAxis = d3.svg.axis().scale(this.sliderx).orient("top");
    this.mainXAxis = mainView.append("g")
        .attr("class", "axis")
        .call(xAxis);
    
    this.zoom = d3.behavior.zoom()
        .scaleExtent([1, Infinity])
        .on("zoom", this.zooming.bind(self));
    
    this.mainGraph = mainView.append("g")
        .attr("clip-path", "url(#clip)")
        .call(this.zoom);
  };
  
  ESChart.prototype.zooming = function() {
    var self = this;
    //console.log("zooming scale: ", d3.event.translate, d3.event.scale);
    console.log("mainx domain: ", this.mainx.domain());
    
    //update x axis
    this.mainXAxis.call(d3.svg.axis().scale(this.mainx).orient("top"));
    
    //output an event for 'timeRange'
    self.io.setValue('timeRange', this.mainx.domain());
    //trigger renew with new 'timeRange' -- backend server will use it
    self.io.renewTrigger({ _width_: self.mainWidth, _remove_: true, 
                          _section_: self.section,  _syn_chart_id_: self.synChartId++ });
  };
  

  ESChart.prototype.debounceD3Event = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      var evt  = d3.event;

      var later = function() {
        timeout = null;
        if (!immediate) {
          var tmpEvent = d3.event;
          d3.event = evt;
          func.apply(context, args);
          d3.event = tmpEvent;
        }
      };

      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) {
        var tmpEvent = d3.event;
        d3.event = evt;
        func.apply(context, args);
        d3.event = tmpEvent;
      }
    };
  };
    
  
  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf ESChart
   */
  ESChart.prototype.renderSlider = function (containerElement,containerWidth, containerHeight) {
    var self = this,
        range  = self.io.data.overviewRange,
        extent = self.io.get('timeRange');
    
    if(!extent){
        extent = range;
    }
    
    var x_mapping = self.sliderx.domain(range);
    
    //define brush function
    var brushed= function() {
          
      if(d3.event.sourceEvent){
          d3.event.sourceEvent.stopPropagation();
      }
      //get and transform selected data to sampled data, and then set it to _x.domain
      var select_domain = brush.extent();
          
      if(select_domain && select_domain[0]!= select_domain[1]) {
      
        self.mainx.domain(select_domain);
        self.mainXAxis.call(d3.svg.axis().scale(self.mainx).orient("top"));

        //reset x-scale
        self.zoom.x(self.mainx);
        
        //output an event for 'timeRange'
        self.io.setValue('timeRange', select_domain);
        
        //stop previous processing and restart new one-- how to stop previous processing in renew function?
        
        //trigger renew with new 'timeRange' -- backend server will use it
        self.io.renewTrigger({ _width_: self.mainWidth, _remove_:true,
                              _section_: self.section,  _syn_chart_id_: self.synChartId++ });
      }
    };
    
    //define brush (range and its event)
    var brush = d3.svg.brush()
        .x(x_mapping)
        .extent(extent)
        .on("brush", self.debounceD3Event(brushed, self.sliderWidth));
  
    self.sliderView.append("svg:rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", self.sliderWidth)
          .attr("height",self.sliderHeight)
          .attr("class", "srect");
  
    //draw brushed area
     self.sliderView.append("g")
          .attr("class", "x brush")
          .call(brush) //get x range data
          .call(brush.event)
          .selectAll("rect")
            .attr("y", -6)
            .attr("height", self.sliderHeight + 7);
    
    //draw axis
    var x_start = self.sliderx.domain(self.io.data.overviewRange);
    var sliderXAxis = d3.svg.axis().scale(x_mapping).orient("bottom");
    self.sliderView.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + self.sliderHeight +")")
      .call(sliderXAxis);
  };

  
  /**
   * draw normal line chart if number of selected item is 1 or more than 1
   * @method params
   * @memberOf DetailChart
   */
  ESChart.prototype.renderUnoperableData = function (delFlag) {
    var self = this;
    
    //get and set range
    var range = self.io.get('timeRange');
    if(!range || range[0]==range[1]){
        range = self.io.data.overviewRange;
    }
    self.mainx.domain(range);
    
    var detail = self.io.data.unoperable
                    .map(function(d){return self.mainx(+d);})
                    .filter(function(d){return d>=0 && d<=self.mainWidth});
    
    var lines =self.mainGraph.selectAll(".line")
      .data(detail, function(d) {return d+'_'; });
   
    lines.enter()
      .append("line")
      .attr("class", "line")
      .attr("x1", function (d) { return d; })
      .attr("x2", function (d) { return d; })
      .attr("y1", 0);

    //enter + update
    lines.attr("y2", function (d) { return self.mainHeight; });
        
    if(delFlag){
      //remove items which is not including in current data
      lines.exit().remove();
    }
  }

  /**
   * draw difference line chart if number of selected items are 2
   * @method params
   * @memberOf ESChart
   */
  ESChart.prototype.renderOperableData = function (delFlag) {
    
    // init local variables
    var self     = this;
    
    // get blocks data
    var blocks = self.io.data.operable;
    
    //get and set range
    var range = self.io.get('timeRange');
    if(!range || range[0]==range[1]){
        range = self.io.data.overviewRange;
    }
    self.mainx.domain(range),
    
    self.lengthx.domain([0, range[1]-range[0]]);
    
    var blocks_nodes = self.mainGraph.selectAll(".rect")
        .data(blocks, function(d){ return '_'+d.task_id; });
    
    blocks_nodes.enter()
      .append("svg:rect")
      .attr("x", function(d){
        return self.mainx(d.start);
       })
      .attr("y", 0)
      .attr("height", self.mainHeight)
      .attr("class", "rect")
      .on("mouseover", function(d, i) {
          self.tooltip.transition()
               .duration(10)
               .style("opacity", 1);
          self.tooltip.html("task_id=" + d.task_id+ ",<br>start="+ d.start +",<br>end="+(d.start+d.length))
               .style("left", (d3.event.pageX) + "px")
               .style("top", (d3.event.pageY) + "px");;
        })
      .on("mouseout", function(d, i) {
          self.tooltip.transition()
               .duration(800)
               .style("opacity", 0);
        });

    //enter+update
    blocks_nodes.attr("width", function(d) {
        return Math.max(self.lengthx(d.length), 1);
       });
    
    if(delFlag) {
      //remove items which are not including in current data
      blocks_nodes.exit().remove();
    }
  };


  return ESChart;
});
