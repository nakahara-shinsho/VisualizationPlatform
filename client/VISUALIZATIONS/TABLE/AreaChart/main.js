/**
 * @fileOverview implement for AreaChart
 */

/**
 * Create AreaChart main function
 * @class AreaChart
 * @param {type} AxisSelectable AxisSelectable class
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {AreaChart}
 */
define(["util/AxisSelectable",
	"util/CustomTooltip",
        "text!./control.html",
        "css!./AreaChart"], function (AxisSelectable, CustomTooltip, designTpl) {
  /**
   * Constructor create AreaChart
   * @class AreaChart
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {AreaChart}
   */
  var AreaChart = function (io) {
    this.io = io;

    if(!this.io.isHighlightMode() && !this.io.isDrilldownMode()) {
	this.io.setHighlightMode();
    }
    
    //higher priority for set initial io variable values from template
    this.io.dataManager().setMapperProps({
      xaxis: {type: 'number', label: 'X axis', map2: '' },
      yaxis: {type: 'number', label: 'Y axis', map2: [] }
    });
    this.io.designManager()
      .setControl("yaxisCaption", {type:"regx", name:"Y AXIS Caption", value:"Y-AXIS"});
    this.io.designManager()
      .setControl("graphType", {type:"radio", name:"Graph Type", range:["stacked","normalized", "individual"], value: "stacked"});
    this.io.designManager()
      .setControl("interpolationType", {type: "radio", name: " Interpolation Type",
                                range:["linear", "step","step-before","step-after","basis","bundle","cardinal","monotone"],
                                value:"linear"});
    this.io.designManager()
      .setControl("yaxisticknum", {type:"regx", name:"Y AXIS TICKS NUM", value: 3});
    this.io.designManager().setControl("autoMappingMode"  , {type:"radio", name:"Auto Mapping Mode",range:["ON", "OFF"], value:"OFF"});
  };
  /**
   * update chart according with changed of interface variables
   * @method AreaChart
   * @memberOf AreaChart
   * @returns {AreaChart}
   */
  AreaChart.prototype.update = function (changedAttr) {
    var self = this;
    
    // if _CHART_ changed
    if(changedAttr.hasOwnProperty("DATA_MANAGER")) {
      if(changedAttr.DATA_MANAGER.SELECTOR !== undefined &&
         changedAttr.DATA_MANAGER.SELECTOR.length > 0){
          var selectedLegends = self.getSelectedLegends();
      }
	this.redraw();
    } else if (changedAttr.hasOwnProperty("DESIGN_MANAGER")) {   
      this.redraw();
    } else 
    if(changedAttr.hasOwnProperty("COLOR_MANAGER") ) {
      this.redraw();
    } else  {//MODE change
    //if(this.io.isDrilldownMode()){
        this.redraw();
    }
    
  };
  
   AreaChart.prototype.redraw = function() {
    var self = this;

      this.axisHeight   = this.containerHeight -
	  this.layout.top -
	  this.xConfig.caption.height -
	  this.xConfig.label.height -
	  this.xConfig.scrollbar.height;

      this.axisWidth = this.containerWidth -
	  this.layout.yaxis.width -
	  this.layout.main.margin.right;

      this.height = this.containerHeight;

      this.scaleX = d3.scale.linear().range([0, this.axisWidth]);    
      this.scaleY = d3.scale.linear().range([this.axisHeight, 0]);
       if(this.io.designManager().getValue("autoMappingMode") == "ON") {
	   this.autoMapping();
       }

       this.createChartHeader();
       this.drawCharts();
  };
 
  /**
   * render Line Chart
   * @method render
   * @memberOf AreaChart
   */
  AreaChart.prototype.render = function (containerWidth, containerHeight) {
    if(this.io.designManager().getValue("autoMappingMode") == "ON") {
	this.autoMapping();
    }
    this.initialize(containerWidth, containerHeight);    
      
    // create chart header
    this.createChartHeader();
    // create charts
    this.drawCharts();

    return this.svg_dom;      
    
  };
  /**
   * initialize
   * @method initialize
   * @memberOf AreaChart
   */
  AreaChart.prototype.initialize = function (containerWidth, containerHeight) {

      /** Layout **/
      this.layout ={
	  top  : 20,
	  yaxis: {width: 80},
	  main:  {margin:{right: 50}}
      };

      /** Y AXIS **/
      this.yConfig = {
	  scale: "basic",
	  range: { max:"auto", min:0},
	  caption : {top:-60, left:"auto"}
      };
      /** X AXIS **/
      // X AXIS [width - YAxis_width]
      this.xConfig = {
	  label   : {height: 50},
	  range   : {max:"auto", min:"auto"},
	  caption : {height:20, top:20, left:"auto"},
	  scrollbar: {height:25}
      };

      // set default value for checkbox
      this.defaultCheckbox = false;
      // define width and height of drawing area
      this.margin = {top: 20, right: 40, bottom: 40, left: 40};
      
      // set width, height
      this.containerWidth  = containerWidth;
      this.containerHeight = containerHeight;

      this.width = containerWidth;
      this.height = containerHeight;

      this.axisHeight   = containerHeight -
	  this.layout.top -
	  this.xConfig.caption.height -
	  this.xConfig.label.height -
	  this.xConfig.scrollbar.height;

      this.axisWidth = containerWidth -
	  this.layout.yaxis.width -
	  this.layout.main.margin.right;
  
      this.scaleX = d3.scale.linear().range([0, this.axisWidth]);    
      this.scaleY = d3.scale.linear().range([this.axisHeight, 0]);

      this.name = "g1";
      // init for others      
      this.svg = null;
      this.svg_g = null;

      /** Tooltip **/
      this.tooltipConfig = {
	  caption : "",
	  attributes : [],
	  prefix  : "",
	  postfix : "",
	  offset  : 5
      };
      this.tooltip = new CustomTooltip("tooltip", 200);
      this.root_dom  = undefined;
      this.container = undefined;
      this.containerWidth = containerWidth;
      this.containerHeight= containerHeight;
      this.tooltip.initialize();
  };

  /**
   * Convert received data to understandable data format for this chart
   * @method transformData
   * @memberOf AreaChart
   */
  AreaChart.prototype.transformData = function () {
    var self = this, linesData=[];
      var selectedLegends = self.getSelectedLegends();    
    var ycols = self.io.dataManager().getMapper('yaxis'),
        xcol = self.io.dataManager().getMapper('xaxis'),
        data = (self.io.isHighlightMode())? 
            self.io.dataManager().getData(): self.io.dataManager().getFilteredRows();
        
    if(_.isEmpty(ycols) || _.isEmpty(xcol)) return linesData;
  
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
        return +rowa[xcol] > rowb[xcol] ? 1 : -1;
    });
      var graphType       = self.io.designManager().getValue("graphType");
    if (graphType == "normalized") {
	var sum = 0;
	data.forEach(function (d) {
	    sum = 0;
	    selectedLegends.forEach(function (key) {    
		sum += d[key] - 0;
	    });
	    d.rate = 100 / sum;
	});
    } else {
	data.forEach(function (d) {
	    d.rate = 1;
	})
    }
    // set data to draw chart
    selectedLegends.forEach(function (key) {    
      //set all y data
      var line={name: key};
      line.values = data.filter(function(row){
          return row[key] !== undefined || !isNaN(row[key]);
      }).map(function (row) {
          return {xval:+row[xcol], yval: +(row[key] * row.rate)};
      });
      
      linesData.push(line);
    });
        
    
    return linesData;
  };

    /**
     * create header of chart
     * @method createChartHeader
     * @memberOf LineChart
     */
   AreaChart.prototype.createChartHeader = function () {
       var self = this;

       if(self.svg_dom == undefined){
	   self.svg_dom = document.createElement("div");
       }
       self.svg =  d3.select(self.svg_dom)
           .attr('class', 'areachart');

       if(self.svg.select("g")){
	   self.svg.select("g").remove();
       }
       self.svg_g = self.svg.append("g");      
   };

  /**
   * draw normal line chart if number of selected item is 1 or more than 1
   * @method params
   * @memberOf AreaChart
   */
   AreaChart.prototype.drawCharts = function () {
       self = this;
       var graphType       = self.io.designManager().getValue("graphType");
       if (graphType == "individual") {
	   this.data = this.createIndividualData()
       } else {
	   this.data = this.createStackedData();
       }
       if (typeof(this.data) == "undefined") {
	   return;
       }
       var g1 = this.drawAreaChart(self.data, self.name, {x: 0, y: 0}, this.scaleX, this.scaleY);

       this.drawBrush(g1);
       this.drawTooltip(g1);
   };

   AreaChart.prototype.drawBrushBar = function (data, name, position, scaleX, scaleY) {
       var self = this;
       var svg_g = self.svg_g;       
       var group = svg_g.append("g").attr("class", name);
       
       self.setMainDiv(group, scaleX, scaleY);
       self.setXaxisDiv(group, scaleX, scaleY);
       self.setMainSvg(group , scaleX, scaleY);
       self.setXaxisSvg(group, scaleX, scaleY);
       self.setAxisesDomain(data, scaleX, scaleY);
       self.drawXAxis(data, position, scaleX, scaleY, group);
       return group;
   };

  AreaChart.prototype.drawBrush = function(g1){
   var self = this;
   
   var brushed = function(){
      d3.event.sourceEvent.stopPropagation();
      var filter = {}, xcol = self.io.dataManager().getMapper('xaxis');
      filter[xcol] = self.brush.empty() ? null : self.brush.extent();
      self.io.dataManager().setRowRefiner(filter);
      if(!self.io.isHighlightMode())
      {
        d3.selectAll(".brush").call(self.brush.clear());
      }
   };
   
   this.brush = d3.svg.brush()
         .x(self.scaleX)
         .on("brushstart", function(){
           d3.event.sourceEvent.stopPropagation();
         })
         .on("brushend", brushed);
   
   g1.select(".svgMain").append("g")
     .attr("class","x brush")
     .call(self.brush)
     .selectAll("rect")
     .attr("height", self.height + self.margin.top + self.margin.bottom);
 };

   AreaChart.prototype.createAreaData = function (scaleX, scaleY) {
       area = d3.svg.area()
	   .x(function(d) { 
	       return scaleX(d.xval); 
	   })
	   .y0(function(d) { 
	       return scaleY(d.y0); 
	   })
	   .y1(function(d) { 
	       return scaleY(d.y0 + d.y); 
	   })
          .interpolate(self.io.designManager().getValue("interpolationType"));       
       return area;
   };

   AreaChart.prototype.createStackedData = function () {
       var data = self.transformData();
       if (data.length == 0) {
	   return;
       }
       var stack = d3.layout.stack()
	   .x(function (d) { 
	       return d.xval;
	   })
	   .y(function (d) { 
	       return d.yval;
	   })
	   .values(function (d) { 
	       return d;
	   });
       /*Tranform data for stacking*/
       var data2 = [];
       data.forEach(function (d) {
	   data2.push(d.values)
       });

       stack(data2);
       return data
   };

   AreaChart.prototype.createIndividualData = function () {
       var data = self.transformData();
       if (data.length == 0) {
	   return;
       }
       /*Tranform data for stacking*/
       data.forEach(function (d) {
	   d.values.forEach(function (value) {
	       value.y0 = 0;
	       value.y = value.yval;
	   });
       });

       return data
   };

  /**
   * draw X axis, Y axis for chart
   * @method params
   * @memberOf AreaChart
   */

  AreaChart.prototype.drawXAxis = function (data, position, scaleX, scaleY, group) {
      var self = this;
      var xcolumn = this.io.dataManager().getMapper('xaxis');
      var xAxis = d3.svg.axis().scale(scaleX).orient("bottom")
          .ticks(self.io.designManager().getValue("xaxisticknum"));
      if(self.io.designManager().getValue("xaxisticktype") == "dec"){
          xAxis.tickFormat(d3.format(".2s"));
      }else if(self.io.designManager().getValue("xaxisticktype") == "hex"){
          xAxis.tickFormat(d3.format("#04x"));
      }
      /// 3. Draw
      var height = scaleY.range()[0] + position.y;
      var xAxisG = group.select(".svgXaxis")
	  .append("g")
          .attr("class", "xAxis");
      xAxisG.call(xAxis)
	  .append('text')
	  .attr('x',self.axisWidth/2)
	  .attr('y',self.margin.bottom)
	  .text((xcolumn)? xcolumn:'X');
  };
  AreaChart.prototype.drawYAxis = function (data, position, scaleX, scaleY, group) {
      var self = this;
	var yAxis = d3.svg.axis().scale(scaleY).orient("left")
            .ticks(self.io.designManager().getValue("yaxisticknum"))
            .tickFormat(d3.format(".2s"));
	/// 3.Draw
	group.select(".svgYaxis")
	    .append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("class"," yaxiscaption")
            .attr("transform", "rotate(-90)")
            .attr("y", self.yConfig.caption.top)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(self.io.designManager().getValue("yaxisCaption"));
  };

  AreaChart.prototype.drawAxises = function (data, position, scaleX, scaleY, group) {
      var self = this;
      self.drawXAxis(data, position, scaleX, scaleY, group);
      self.drawYAxis(data, position, scaleX, scaleY, group);      
      return;
  };


   AreaChart.prototype.setYaxisDiv = function (group, scaleX, scaleY) {   
       var self = this;
       group.append("div")
           .attr("class","areachart-yaxis")
           .style("width", function(){
               return self.layout.yaxis.width;
           });
   };
   AreaChart.prototype.setMainDiv = function (group, scaleX, scaleY) {   
       var self = this;
       group.append("div")
           .attr("class","areachart-main")
           .style("width", function(){
               return self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right +"px";
           })
	   .style("height",   function(){
	       return self.layout.top + scaleY.range()[0] + "px";
	   });
   };
   AreaChart.prototype.setXaxisDiv = function (group, scaleX, scaleY) {   
       var self = this;
       group.append("div")
           .attr("class","areachart-xaxis")
           .style("width", function(){
               return self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right +"px";
           })
           .style("overflow-x","auto");
   };
   AreaChart.prototype.setDiv = function (group, scaleX, scaleY) {
       var self = this;
       self.setYaxisDiv(group, scaleX, scaleY);
       self.setMainDiv(group, scaleX, scaleY);
       self.setXaxisDiv(group, scaleX, scaleY);
   };
	    
   AreaChart.prototype.setYaxisSvg = function (group, scaleX, scaleY) {
      var self = this;
       group.select(".areachart-yaxis").append("svg")
           .attr("class","yaxis")
           .attr("width", self.layout.yaxis.width)
	   .style("height",   function(){
	       return self.layout.top + scaleY.range()[0] + "px";
	   })
           .append("g")
           .attr("transform", "translate(" +
		 self.layout.yaxis.width+","+ self.layout.top + ")")
           .attr("class","svgYaxis");
   };
   AreaChart.prototype.setMainSvg = function (group, scaleX, scaleY) {
      var self = this;
       group.select(".areachart-main").append("svg")
	   .attr("class", "svgMain")
	   .style("height",   function(){
	       return self.layout.top + scaleY.range()[0] + "px";
	   })
	   .style("width", self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right);
   };
   AreaChart.prototype.setXaxisSvg = function (group, scaleX, scaleY) {
      var self = this;
       group.select(".areachart-xaxis").append("svg")
           .attr("class", "svgXaxis")
           .style("width", function(){
               return self.containerWidth - self.layout.yaxis.width - self.layout.main.margin.right +"px";
           })
           .style("overflow-x","auto")
           .attr("height", self.xConfig.caption.height + 40);       
   };

   AreaChart.prototype.setSvg = function (group, scaleX, scaleY) {
       var self = this;       
       self.setYaxisSvg(group, scaleX, scaleY);
       self.setMainSvg(group, scaleX, scaleY);
       self.setXaxisSvg(group, scaleX, scaleY);
   };
	    
   AreaChart.prototype.drawAreaChart = function (data, name, position, scaleX, scaleY) {
       var self = this;

       var svg_g = self.svg_g;       
       var group = svg_g.append("g").attr("class", name);
       
       self.setDiv(group, scaleX, scaleY);
       self.setSvg(group, scaleX, scaleY);       
       self.setAxisesDomain(data, scaleX, scaleY);
       self.drawAxises(data, position, scaleX, scaleY, group);

       var gMain = group.select(".svgMain")
	   .append("g")
	   .attr("transform", "translate(0," + self.layout.top +")");
       var gArea = gMain.selectAll("." + name + "area")
	   .data(data)
	   .enter().append("g")
	   .attr("class", name + "area")
	   .attr("transform", "translate(" + 0 + "," + position.y + ")")
	   .attr('id', function (d, i) {
               return d.name.replace(/ /g, "_");
	   });
       var colorManager = self.io.colorManager();
       var area = this.createAreaData(scaleX, scaleY);
       var color = d3.scale.category20().range();
       var colorCounter = 0;
       gArea.append("path")
	   .attr("d", function (d) {
               return area(d.values);
	   })
	   .style("fill", function (d) {
                 return color[colorCounter++ % 20];
	   })
	   .style("fill-opacity", 0.8);

       return group;
  };

  /**
   * get domain value for X, Y axis
   * @method setAxisesDomain
   * @memberOf AreaChart
   */
  AreaChart.prototype.setAxisesDomain = function (data, scaleX, scaleY) {
      var self = this;
      var xMin = d3.min(data, function(d1) {
	  var values = d1.values.map(function (d) {
	      return d.xval;
	  });
	  return d3.min(values);
      });
      var xMax = d3.max(data, function(d1) {
	  var values = d1.values.map(function (d) {
	      return d.xval;
	  });
	  return d3.max(values);
      });
      scaleX.domain([xMin, xMax]);
      var yMin = d3.min(data, function(d1) {
	  var values = d1.values.map(function (d) {
	      return d.yval;
	  });
	  return d3.min(values);
      });
      var yMax = d3.max(data, function(d1) {
	  var values = d1.values.map(function (d) {
	      return d.y0 + d.y;
	  });
	  return d3.max(values);
      });
      scaleY.domain([0, yMax]);
  };
  
  
   AreaChart.prototype.drawTooltip = function(g1) {
    var self = this;
    var selectedLegends = self.getSelectedLegends();
    var line = g1.selectAll(".areachart-main").select("g")
	   .append("line")
           .attr("class","tooltips")
           .attr("x1", 0).attr("x2", 0)
           .attr("y1", 0)
           .attr("y2", function(){
               return self.axisHeight;})
          .style("display","none")
           .style("stroke", "red");
       // ACTION
//       self.svg_g.selectAll("." + self.name + "area")
       self.svg_g.select("div.areachart-main")
	   .on("mouseover", function(d, i, j){
               d3.select(this).style("fill-opacity", 0.5);
               line.style("display","block");
	   })
	   .on("mousemove", function(){
               var xPosition = d3.mouse(this)[0] - self.tooltipConfig.offset;
               // line
               line.attr("x1", xPosition).attr("x2", xPosition);

               // tooltips
	       var tooltipKey     = self.io.dataManager().getMapperProps("xaxis").map2;
               var tooltipValue   = parseInt(self.scaleX.invert(xPosition));
               // Add X Label
	       if(self.io.designManager().getValue("xaxisticktype") == "hex"){
		   tooltipValue = "0x" + tooltipValue.toString(16);
	       }
               var tableData = createTableData(tooltipValue);
	       var test = 0;
               self.tooltip.show(self.tooltip.table(tableData, self.tooltipConfig), d3.event);
	   })
	   .on("mouseout", function(d){
               line.style("display","none");
               d3.select(this).style("fill-opacity", 0.8);
               self.tooltip.hide();
	   });

       function createTableData(xValue){
	   var tableData = []; // key,color,value
	   var highlights = self.io.dataManager().getMapperProps("yaxis").map2;
	   if(self.io.isHighlightMode()){
               highlights = self.io.dataManager().getColumnRefiner();
	   }
	   self.tooltipConfig.caption = self.io.dataManager().getMapperProps("xaxis").map2 + " : " +  xValue;
	   var colorManager = self.io.colorManager();
	   var color = d3.scale.category20().range();
	   var colorCounter = 0;
	   self.data.forEach(function(d){
               var elem = {};
               if(selectedLegends.indexOf(d.name) !== -1){
		   elem.key = d.name;
		   if(highlights.indexOf(d.name) !== -1){
		       if(self.io.colorManager().getDomainName() !== "Y axis"){
			   elem.color = color[colorCounter++ % 20];
		       }else{
			   elem.color = color[colorCounter++ % 20];
		       }
		   }
		   elem.y0 = 0;
		   elem.y = 0;
		   for(var i=0; i< d.values.length; i++){
		       if(d.values[i].xval == xValue){
			   elem.y0 = d.values[i].y0;
			   elem.y = d.values[i].y;
			   elem.value = d.values[i].y + d.values[i].y0;
			   break;
		       }else if(d.values[i].xval < xValue){
			   elem.y0 = d.values[i].y0;
			   elem.y = d.values[i].y;
			   elem.value = d.values[i].y + d.values[i].y0;
		       }else{
			   break;
		       }
		   }
               }
               tableData.push(elem);
	   });
	   return tableData;
       }
   };
 AreaChart.prototype.getSelectedLegends = function (refresh) {
    var self = this;
    var selectedLegends = [];
    if(self.io.isHighlightMode()) {
      selectedLegends = self.io.dataManager().getMapperProps("yaxis").map2;
    }else{
      var selectedColumns = self.io.dataManager().getColumnRefiner();
      var ycols = self.io.dataManager().getMapperProps("yaxis").map2;
      var pos = 0;
      ycols.forEach(function(col){
        if(selectedColumns.indexOf(col) !== -1){
          selectedLegends.push(col);
        }
      });
    }
    return selectedLegends;
  };
 AreaChart.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    var self = this;

    self.containerWidth  = containerWidth;
    self.containerHeight = containerHeight;
    self.redraw();
  };
 AreaChart.prototype.autoMapping = function() {
   var self = this;
   var dataTypes = self.io.dataManager().getDataType();
   var mappedData = [];
   var mapperProps;
   var removedData = [];
   var table = self.io.dataManager().getData();

   mapperProps = self.io.dataManager().getMapperProps();
   Object.keys(table[0]).forEach(function(key) { 
     if (dataTypes[key] == "number") {
       if (mapperProps.xaxis.map2 != key) {
	 mappedData.push(key);
       }
     }   
   });
   Object.keys(mapperProps).forEach(function(key) {
     if (typeof mapperProps[key].map2 == "object") {
         self.io.dataManager().setMapper(key, mappedData);
     }
   });
 };

  return AreaChart;
});
