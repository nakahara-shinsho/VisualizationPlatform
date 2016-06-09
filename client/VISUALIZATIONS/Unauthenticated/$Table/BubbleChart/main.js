/**
 * @fileOverview implement for BubbleChart
 * @author ThongKN - modifier
 * @version 1.1
 * @copyright TSDV
 */

/** @module BubbleChart*/

/**
 * Create BubbleChart main function
 * @class BubbleChart
 * @param {type} $ jquery
 * @param {type} d3 d3 library
 * @param {type} Utils Utils class
 * @returns {_L14.BubbleChart}
 */
define(['util/tooltip/OldTooltip'],function(CustomTooltip) {
    var _this;

    var BubbleChart = function (io) {
        this.io = io;
        _this = this;
    };

    BubbleChart.prototype.update = function(params, changed) {
      changed.forEach(function (attr) {
      });
    };

    /**
     * render Bubble Chart
     * @method render
     * @memberOf BubbleChart
     */
    BubbleChart.prototype.render = function (containerWidth, containerHeight) { //div id
        // initialize
        this.initialize(containerWidth, containerHeight);
        // convert data
        this.convertData(this.io.dataManager().getData());
        // create chart header
        this.createChartHeader();
        // create Bubble Chart
        this.createBubbleChart();
        return this.container_dom;
    };

       
    /**
     * initialize
     * @method initialize
     * @memberOf BubbleChart
     */
    BubbleChart.prototype.initialize=function(containerWidth, containerHeight) {
		    // define width and height of drawing area
        // set width, height
        _this.width         = containerWidth;
        _this.height        = containerHeight;
        //_this.chartWidth    = 800;
        //_this.chartHeight   = 600;
        // set margin
        _this.margin        = {top: 40, right: 100, bottom: 40, left: 100};
        _this.marginHeight  = 0;
        
    		// init size of bubble
    		_this.maxSizeBubble = 50;
        _this.minSizeBubble = 5;
		
    		// init values for bubble animation		
    		_this.layoutGravity = -0.01;
        _this.damper        = 0.1;
        _this.friction      = 0.83;
        _this.exponent      = 0.5;
        
        //Define tooltip to display some information of when move mouse over each element of chart
        _this.tooltip 		= new CustomTooltip("tooltip", 240);

        // Parser data by group to divide chart by group
        _this.elementCenter = {};
		    _this.groups        = [];
        _this.numberGroup   = 0;
        _this.column        = 4;
        
		    // init chart element
        _this.svg           = null;
        _this.nodes         = [];
        _this.force         = null;
        _this.circles       = null;
        _this.fillColor     = d3.scale.ordinal().domain([-3,-2,-1,0,1,2,3])
            .range(["#d84b2a", "#ee9586","#e4b7b2","#AAA","#beccae", "#9caf84", "#7aa25c"]);
        
		    // init data used for chart
        _this.chartData     = [];
        _this.standardData  = [];
    };
    
    /**
     * convert data if need
     * @method convertData
     * @memberOf BubbleChart
     */
    BubbleChart.prototype.convertData=function(data) {
		    // get data which loaded from file
        var rawData     = data,
            column      = 4,
            numberGroup = 0,
            dataByGroup = [];        

		    // convert to standard data
        _this.standardData = [];
        rawData.forEach(function(d) {
            var obj = {
                size : d.access_frequency,
                group: d.func_name,
                color: d.variable_name,
                name : d.leaf_name
            };
            _this.standardData.push(obj);
        });
        // sort data
        _this.standardData.sort(function (a, b) {
            return d3.ascending(a.color , b.color);
        });
        // get max size
        _this.maxSize   = d3.max(_this.standardData, function (d) {
            return parseFloat(d.size);
        });
        // set chart data 
        dataByGroup     = this.parseData(_this.standardData);
        _this.chartData = dataByGroup;
        numberGroup     = dataByGroup.length;
		    // divide layout depend on column, number of group and data
        this.divideLayout(numberGroup, column, dataByGroup);
		    // create scale
        _this.radiusScale = d3.scale.pow().exponent(_this.exponent).domain([0, _this.maxSize]).range([_this.minSizeBubble, _this.maxSizeBubble]);
    };
    
    /**
     * create header of chart
     * @method createChartHeader
     * @memberOf BubbleChart
     */
    BubbleChart.prototype.createChartHeader=function() {
        // select container of chart
        this.container_dom = document.createElement("div");
        var container = d3.select(this.container_dom);

        // Create buttons used to display all node or display by each function
        var btnGroup = container.append("div")
                .attr("id", "view_selection")
                .attr("class", "btn-group");
        
        btnGroup.append("button")
                .attr("id", "all")
                .attr("class", "btn active")
                .text("All Node")
                .on("click", this.displayGroupAll)
                .on("mousedown" , function () {
                    d3.event.stopPropagation();
                });
        
        btnGroup.append("button")
                .attr("id", 'group')
                .attr("class", "btn")
                .text("Node By Function")
                .on("click", this.displayByGroup)
                .on("mousedown" , function () {
                    d3.event.stopPropagation();
                });

		    // Append html div for display main chart
        // Create svg 
        _this.svg = container.append("div").attr("id", "vis")
            .attr("align", "center")
            .append("svg")
            .attr("id", "svg_vis")
            .attr("width", _this.width)
            .attr("height", _this.height-40)
            .attr("viewBox", '0, 0, ' + _this.width + ', ' + _this.height)
            .attr("preserveAspectRatio", 'none')
            .append("g")
                .attr("transform", "translate(" + _this.margin.left + "," + (_this.height-40)/2 + ")");
    };

    /**
     * create Bubble Chart
     * @memberOf BubbleChart
     * @method createBubbleChart
     */
    BubbleChart.prototype.createBubbleChart=function() {  
        // Create Node data from input data
        this.createNodes();
        
        // Map node data to cicle element
        _this.circles = _this.svg.selectAll("circle")
                .data(_this.nodes, function(d) {
                    return d.id;
                });
        
        // Draw each element circle
        _this.circles.enter().append("circle")
            .attr("r", 0)
            .attr("fill" , function (d) {
                return _this.fillColor(d.color);
            })
            .attr("stroke-width", 0)
            .attr("stroke", function(d) {
                return d3.rgb(_this.fillColor(d.color)).darker();
            })
            .attr("class", function(d) {
                return "node";
            })
            .attr("id", function(d) {
                return "bubble_" + d.id;
            })
            .on("mouseover", function(d, i) {
                return _this.showDetails(d, i, this);
            })
            .on("mouseout", function(d, i) {
                return _this.hideDetails(d, i, this);
            });
                
        // Make transition of circles
        _this.circles.transition().duration(2000)
            .attr("r", function(d) {
                return d.radius;
            });
        
            /**
         * Create force layout
         * @method start
         * @memberOf BubbleChart
         * @returns created force layout
         */
        function start() {
            _this.force = d3.layout.force()
                    .nodes(_this.nodes)
                    .size([_this.width, _this.height]);
                    
            return _this.force;
        }

		    // create force layout
        start();    
		    // display All node by default
        this.displayGroupAll();
    };
    
    /**
     * Create nodes for chart
     * @method createNodes
     * @memberOf BubbleChart
     */
    BubbleChart.prototype.createNodes=function() {
        var _id = 1;
        _this.standardData.forEach(function (d) {
           var node;
           node = {
               id : _id, 
               radius: _this.radiusScale(parseFloat(d.size)),
               size: d.size,
               name: d.name,
               color: d.color,
               group: d.group,
               x: _id * parseInt(d.color),
               y: _id * parseInt(d.color)
           };
           _id = _id + 1;
           return _this.nodes.push(node);
        });
        return _this.nodes.sort(function (a, b) {
            return b.size - a.size; 
        });
    };

    /**
     * Display by each group for chart
     * @method displayByGroup
     * @memberOf BubbleChart
     * @return call function to display by group
     */
    BubbleChart.prototype.displayByGroup=function() {
        _this.force.gravity(_this.layoutGravity)
            .charge(function(d) {
              return -Math.pow(d.radius, 2.0) / 4;
             })
            .friction(_this.friction)
            .on("tick", function(e) {
                return _this.circles.each(_this.moveTowardsGroup(e.alpha))
                            .attr("cx", function(d) {
                                return d.x;
                            })
                            .attr("cy", function(d) {
                                return d.y;
                            });
            });
            
        _this.force.start();
        
        // Call function display name of group
        return _this.displayGroupsName();
    };
    
    /**
     * Display name of each group
     * @method displayGroupsName
     * @memberOf BubbleChart
     * @return divided groups
     */
    BubbleChart.prototype.displayGroupsName=function() {
        var groups, groupsData;
        var deviceLayout  = _this.elementCenter;
        var _marginHeight = _this.marginHeight;
        
        groupsData = d3.keys(_this.elementCenter);
        // Map dataByGroup to chart display by group
        groups = _this.svg.selectAll(".groups").data(groupsData);
        
        // Insert text to each group chart
        return groups.enter()
                .append("text")
                .attr("class", "groups")
                .attr("x", function(d, i) {
                    return i*_this.width/groupsData.length + _this.margin.left;
                })
                .attr("y", 0)
                .attr("text-anchor", "top")
                .text(function(d) {
                    return d;
                });
    };

    /**
     * Display all group for chart
     * @method displayGroupAll
     * @memberOf BubbleChart
     * @return call function to hide child group
     */
    BubbleChart.prototype.displayGroupAll=function() {
        _this.force.gravity(_this.layoutGravity)
            .charge(function(d) {
              return -Math.pow(d.radius, 2.0) / 4;
             })
            .friction(_this.friction)
            .on("tick", function(e) {
                return _this.circles.each(_this.moveTowardsCenter(e.alpha))
                            .attr("cx", function(d) {
                                return d.x;
                            })
                            .attr("cy", function(d) {
                                return d.y;
                            });
            });
            
        _this.force.start();
        
         /**
         * Hide groups
         * @method hideGroups
         * @memberOf BubbleChart
         */
        function hideGroups() {
            return _this.svg.selectAll(".groups").remove();
        }
    
        // hide child group
        return hideGroups();
    };
    
	/**
     * Divide layout for chart
     * @method divideLayout
     * @memberOf BubbleChart
     * @param number, column, data
     */
    BubbleChart.prototype.divideLayout=function(number, column, data) {
        var x           = 0,
            y           = 0,
            row         = 0,
            position    = 0,
            result      = parseInt(number / column),
            remain      = number % column,
            widthColumn = _this.width / column,
            heightRow   = 0;
        
        _this.marginHeight = heightRow/2;

        // Set row for layout
        if (remain === 0) {
            row = result;
        } else {
            row = result + 1;
        }
        // set height row
        heightRow = _this.height / row;
        // Get location of each element that want to draw
        for (var i = 0; i < row; i++) {
            for (var j = 0; j < column; j++) {
                position = i * column + j;
                if ( (position) < number) {
                    x = j * widthColumn + (widthColumn);
                    y = i * heightRow + (heightRow / 2);
                    var obj = { x : x, y : y };
                    _this.elementCenter[data[position].key] = obj;
                }
            }
        }
    };
    
    

	/**
     * Show tooltips
     * @param {type} data
     * @param {type} i
     * @param {type} element
     */
    BubbleChart.prototype.showDetails=function(data, i, element) {
        // Hold content of tooltip
        var content;
        d3.select(element).attr("stroke", "black");
        content  = "<span class=\"name\">Function ID  :</span><span class=\"value\"> " + data.group + "</span><br />";
        content += "<span class=\"name\">Leave Node ID:</span><span class=\"value\"> " + data.name + "</span><br />";
        content += "<span class=\"name\">Variable Name:</span><span class=\"value\"> " + data.color + "</span>";
        return _this.tooltip.showTooltip(content, d3.event);
    };

    /**
     * Hide tooltips
     * @param {type} data
     * @param {type} i
     * @param {type} element
     */
    BubbleChart.prototype.hideDetails=function(data, i, element) {
        d3.select(element).attr("stroke", function(d) {
          return d3.rgb(_this.fillColor(d.color)).darker();
        });
        return _this.tooltip.hideTooltip();
    };
    
    BubbleChart.prototype.moveTowardsCenter=function(alpha) {
        var w = _this.width/2,
            h = _this.height/2;

        return function(d) {
            d.x = d.x + (w - d.x) * (_this.damper + 0.02) * alpha;
            d.y = d.y + (h - d.y) * (_this.damper + 0.02) * alpha;
            return d.y;
        };
    };

    BubbleChart.prototype.moveTowardsGroup=function(alpha) {
        return function(d) {
            var target;
            target = _this.elementCenter[d.group];
            d.x = d.x + (target.x - d.x) * (_this.damper + 0.01) * alpha;
            d.y = d.y + (target.y - d.y) * (_this.damper + 0.01) * alpha;
            return d.y;
        };
    };

    /**
     * parse data function
     * @method parseData
     * @memberOf BubbleChart
     * @param {type} data
     * @returns {Array}
     */
    BubbleChart.prototype.parseData=function(data) {
        var groups = [];
        var dataByGroup = [];
        // Declare a variable to check exist of group
        var exist = false;
        // Perform each element of data.
        data.forEach(function (d) {
            // Check size of array dataByVariable. If size = 0, add first element to array
            if (dataByGroup.length === 0) {
                // Difine an object include key (is variable_name) and value
                var obj = {
                    key : d.group,
                    value : []
                };
                // push data to value
                obj.value.push({size : d.size, name : d.name, color : d.color});
                // push obj to dataByVariable array
                dataByGroup.push(obj);
                // push variable_name to variables array
                groups.push(d.group);
            } else {
                // perform each variable_name of variables array
                for (var j = 0; j < groups.length; j++) {
                    // if exist, add new value with current key to dataByVariable array
                    if (dataByGroup[j].key === d.group){
                        dataByGroup[j].value.push({size : d.size, name : d.name, color : d.color});
                        exist = true;
                        break;
                    }
                }
                if (exist === true) {
                    exist = false;
                } else {
                    var obj2 = {
                        key : d.group,
                        value : []
                    };
                    obj2.value.push({size : d.size, name : d.name, color : d.color});
                    dataByGroup.push(obj2);
                    groups.push(d.group);
                }
            }
        });
        // Sort data by key
        dataByGroup.sort(function (a, b) {
            return d3.ascending(a.key, b.key);
        });
        return dataByGroup;
    };

    
	
    return BubbleChart;
});
