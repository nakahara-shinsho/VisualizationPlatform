define(['text!./control.ejs','css!./gantt_chart'], function (tpl) {
  /**
   * Constructor create GanttChartSWC
   * @class GanttChartSWC
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {GanttChartSWC}
   */
  function MyClass(io) {
    this.io = io;
    if(tpl) {
      this.io.useTemplate(tpl);
    }

    //define class private variables
    var _x, _y, _funcids;
    var _focusView, _focusXAxis, _focusBarHeight;

    /**
     * Template of this chart
     * @type {string}
     * @memberOf GanttChartSWC
     */
    this.tpl = tpl;

    /**
     * The function will be called before rendering chart
     * @memberOf GanttChartSWC
     */
    this.validate = function() {
    };

    /**
     * The function will be called after renewing data from server
     * @memberOf GanttChartSWC
     */
    this.renew = function() {
      var self = this;
      var data = io.details;

      //update X axis ( of details )
      _x.domain(self.io.getValue('timeRange'));
      _focusView.select(".x.axis").call(_focusXAxis); //set updated x to X axis

      _funcids.forEach(function (funcid, index) {
        var class_name = "grp_"+funcid;
        var sampled_data = [];
        if(data[funcid]){
          sampled_data = data[funcid];
        }
        //resampling selected raw data
        var baseBarHeight = _focusBarHeight-3;
        var h_position =  _focusBarHeight * index;
        var lines = _focusView.selectAll("."+class_name)
                .data(sampled_data);

        lines.enter().append("line")
            .attr("class", class_name)
            .attr("x1", function(d,i){ return i;})
            .attr("x2", function(d,i){ return i;})
            .attr("y1", baseBarHeight)
            //.attr("y2", function(d){return (d)?0: baseBarHeight;})
            .attr("transform", "translate(0," + h_position + ")")

        lines.exit().remove();

        lines.transition()
              .duration(0)
              .attr("y2", function(d){return (d)? 0: baseBarHeight;});

      }); //for each end
    };

    /**
     * Define private update function
     * @memberOf GanttChartSWC
     */
    this.update = function() {
    };

    /**
     * Render
     * @param {Element} containerElement - element which will contain this chart
     * @param {number} containerWidth - container width
     * @param {number} containerHeight - container height
     * @memberOf GanttChartSWC
     */
    this.render = function (containerElement, containerWidth, containerHeight) {
        var self = this;

        var chartWidth = 800, chartHeight=800;
        var colors = ["black"];

        var contextMargin = {top: 20, right: 10, bottom: 600, left: 110};
        var focusMargin =   {top: 20, right: 10, bottom: 20,  left: 110};

        var myContainer= d3.select(containerElement);
        myContainer.select('svg').remove();

        var contextHeight  = chartHeight - contextMargin.top - contextMargin.bottom;
        var height  = contextMargin.bottom - focusMargin.top   - focusMargin.bottom; //?
        var width   = chartWidth  - focusMargin.left  - focusMargin.right;

        _x   = d3.scale.linear().range([0, width]); //details
        _y   = d3.scale.linear().range([height, 0]);

        var overview_x  = d3.scale.linear().range([0, width]), //context, overview
            overview_y  = d3.scale.linear().range([contextHeight, 0]);

        var contextXAxis = d3.svg.axis().scale(overview_x).orient("top");

        _focusXAxis = d3.svg.axis().scale(_x).orient("top");

        var svg = myContainer
          .append("svg")
            .attr("class", 'ganttchartswc')
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .attr("viewBox", '0, 0, ' + chartWidth + ', ' + chartHeight)
            .attr("preserveAspectRatio", 'none');

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
          .append("rect")
            .attr("width", chartWidth)
            .attr("height", chartHeight);

          //container of context view
        var context = svg
              .append("g")
              .attr("transform", "translate(" + contextMargin.left + "," + contextMargin.top + ")");

          //container of focus view
        _focusView = svg
              .append("g")
              .attr("transform", "translate(" + focusMargin.left + "," +
                    (chartWidth -contextMargin.bottom+focusMargin.top) + ")");

          //define brush (range and its event)
        var brush = d3.svg.brush()
              .x(overview_x)
              .on("brush", debounceD3Event(brushed, 800));

        var overview_data = io.overview,
            details_data = io.details;

        //collect function id list
        _funcids = _.keys(overview_data);

        //define domain for context and focus
        overview_x.domain([io._digest_['min'], io._digest_['max']]);
        overview_y.domain([0, _funcids.length]);

        //set timeRange initvalue and range
        this.io.setValue({timeRange: overview_x.domain()});
        this.io.setDesigner('timeRange', {type: 'slider', range: overview_x.domain() });

        //define area of context view
        var contextBarHeight = contextHeight / _funcids.length;

        //define area of focus (details) view
        var details = io.details;
        if(self.io.get('timeRange')){
          _x.domain(self.io.getValue('timeRange'));
        }else{
          _x.domain(overview_x.domain());
        }
        _y.domain(overview_y.domain());
        _focusBarHeight = height / _funcids.length;
        var focusArea = d3.svg.area()    // ※ performance problem in the process
              .interpolate("step_after")
              .x(function (d, i) { return i; })
              .y0(0)
              .y1(function (d) {return d; });

        //loop into each funcid and draw graphs
        _funcids.forEach(function (funcid, index) {

          var class_name = "grp_"+funcid;
          var h_position = h_position =  contextBarHeight*index;
          var baseBarHeight = contextBarHeight-2;

          //draw background rectangle of overview
          context.append("svg:rect")
                  .attr("x", -80)
                  .attr("y", 0)
                  .attr("width", width+ 80)
                  .attr("height", baseBarHeight)
                  .attr("class", "rect")
                  .attr("transform", "translate(0," + h_position + ")");

          var sampled_data = overview_data[funcid];
          if(sampled_data) {
            context.selectAll("."+class_name)
                 .data(sampled_data)
                 .enter().append("line")
                 .attr("class", class_name)
                 .attr("x1", function(d,i){ return i;})
                 .attr("x2", function(d,i){ return i;})
                 .attr("y1", baseBarHeight)
                 .attr("y2", function(d){return (d)?0: baseBarHeight;})
                 .attr("transform", "translate(0," + h_position + ")");
          }

          //draw background rectangle of _focusView
          h_position =  _focusBarHeight * index;
          baseBarHeight = _focusBarHeight -3;
          _focusView.append("svg:rect")
                  .attr("x", -80)
                  .attr("y", 0)
                  .attr("width", width+ 80)
                  .attr("height", baseBarHeight)
                  .attr("class", "rect")
                  .attr("transform", "translate(0," + h_position + ")");
          //resampling filtered data
          sampled_data = details_data[funcid];//self.resample(filtered_details_data, width);
          if(sampled_data) {
            _focusView.selectAll("."+class_name)
                 .data(sampled_data)
                 .enter().append("line")
                 .attr("class", class_name)
                 .attr("x1", function(d,i){ return i;})
                 .attr("x2", function(d,i){ return i;})
                 .attr("y1", baseBarHeight)
                 .attr("y2", function(d){return (d)?0: baseBarHeight;})
                 .attr("transform", "translate(0," + h_position + ")");
          }//if end

        });//_funcids foreach end

          //draw X axis
          _focusView.append("g")
            .attr("class", "x axis")
            .call(_focusXAxis);

          context.append("g")
            .attr("class", "x axis")
            .call(contextXAxis);

          //draw brushed area
          context.append("g")
            .attr("class", "x brush")
            .call(brush) //get x range data
            .selectAll("rect")
              .attr("y", -6)
              .attr("height", contextHeight + 7);

          //draw unit name for Y axis
          context.append("g")
           .attr("class", "y axis")
           .append('text')
             .text('Functions')
             .attr('class', "annotation")
             .attr('transform', "rotate (90, 0, 0)")
             .attr('x', 0)
             .attr('y', 100);

          _focusView.append("g")
           .attr("class", "y axis")
           .append('text')
             .text('Functions')
             .attr('class', "annotation")
             .attr('transform', "rotate (90, 0, 0)")
             .attr('x', 0)
             .attr('y', 100);

          //draw labels for Y axis
          _funcids.forEach(function (d, index){
              context.select(".y.axis") //for context (stem from context view coordinate system)
                .append("text")
                  .text("Func #"+d)
                  .attr("x",  -80)
                  .attr("y", contextBarHeight*index +contextBarHeight/2);

              _focusView.select(".y.axis") //for focus  (stem from focus view coordinate system)
                .append("text")
                  .text("Func #"+d)
                  .attr("x",  -80)
                  .attr("y",  _focusBarHeight*index +_focusBarHeight/2);
          });


        //define brush function
         function brushed() {
            d3.event.sourceEvent.stopPropagation();//add in 2014/12/25
            //get and transform selected data to sampled data, and then set it to _x.domain
            var select_domain = brush.extent();
           if(select_domain[0] && select_domain[1] && select_domain[0]!= select_domain[1]) {
              //output an event for 'timeRange'
              self.io.setValue('timeRange', [select_domain[0], select_domain[1]]);
              //self.update();//update me
              //trigger renew with new 'timeRange' -- backend server will use it
              self.io.renewTrigger({ _blocks_: ['details'] });
           }
          }

          function debounceD3Event(func, wait, immediate) {
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
          }

      }; //render eof
  }//MyClass end

  return MyClass;

});