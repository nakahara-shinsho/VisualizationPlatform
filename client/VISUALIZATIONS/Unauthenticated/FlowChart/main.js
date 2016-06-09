/**
 * @fileOverview Initial config additional library files implement for FlowChart
 * @author ThongKN
 * @version 1.3
 * @copyright TSDV
 */

/**
 * Create FlowChart main function
 * @param {type} $ jquery
 * @param {type} $1 jquery bpopup
 * @param {type} CustomTooltip CustomTooltip class
 * @param {type} Sankey Sankey class
 * @returns {FlowChart} Flow Chart
 */
define(["util/tooltip/OldTooltip", "./Sankey", "css!./FlowChart"], function (CustomTooltip, Sankey) {
  /**
   * Constructor create FlowChart
   * @class FlowChart
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {FlowChart}
   */
  var FlowChart = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.setValue({
      'setTreeMode': false,
      'changeColor': {label: "", color: "#000000"}
    });
  };
  var getJsonValues;

  /**
   * update chart according with changed of interface variables
   * @method FlowChart
   * @memberOf FlowChart
   * @returns {FlowChart}
   */
  FlowChart.prototype.update = function (changedAttr) {
    var self = this;

    if (changedAttr.hasOwnProperty("setTreeMode")) {
      // if multi series is set true then draw multi series chart
      self.treeMode = changedAttr.setTreeMode;
    }

    // Set color
    if (changedAttr.hasOwnProperty("changeColor")) {
      d3.select("#flowrect-" + changedAttr.changeColor.id).style("fill", changedAttr.changeColor.color);
    }


  };

  /**
   * This function will validate input data for drawing chart.
   * If data is valid, chart will be drawn.
   * @returns {Boolean}
   */
  FlowChart.prototype.validate = function () {
    var nodesData = this.io.nodes;
    var linksData = this.io.links;
    var treeData = this.io.tree;
    this.listValues = [];

    // check data empty or not
    if (nodesData.length === 0) {
      return false;
    } else {
      getJsonValues(treeData, this);
      var checkData = validateNodesData(nodesData) && 
            validateLinksData(linksData) && 
            validateJsonValues(this.listValues);
      if (!checkData) {
        return false;
      }
    }
    return true;
  };
  /**
   * Check nodesData data
   * @param {type} nodesData
   * @returns {Boolean}
   *  + true: data just only contain numbers
   *  + false: data contain string
   */
  function validateNodesData(nodesData) {
    // Check nodes data
    var nodeHeader = Object.keys(nodesData[0]);
    for (var i = 0; i < nodesData.length; i++) {
      var nodeRow = nodesData[i];
      if (!$.isNumeric(nodeRow[nodeHeader[0]])) {
        return false;
      }
    }
    return true;
  }
  /**
   * Check linksData data
   * @param {type} linksData
   * @returns {Boolean}
   *  + true: data just only contain numbers
   *  + false: data contain string
   */
  function validateLinksData(linksData) {
    // Check links data
    if (linksData.length > 0) {
      var linkHeader = Object.keys(linksData[0]);
      for (var j = 0; j < linksData.length; j++) {
        var linkRow = linksData[j];
        if (!$.isNumeric(linkRow[linkHeader[0]]) || 
            !$.isNumeric(linkRow[linkHeader[1]]) || 
            !$.isNumeric(linkRow[linkHeader[2]])) {
          return false;
        }
      }
    }
    return true;
  }
  
  function tco(f) {
    var value;
    var active = false;
    var accumulated = [];

    return function accumulator() {
      accumulated.push(arguments);

      if (!active) {
        active = true;

        while (accumulated.length) {
          value = f.apply(this, accumulated.shift());
        }

        active = false;

        return value;
      }
    };
  }
  /**
   * Get json values
   * @param {type} treeData
   * @param {type} chart
   * @returns {Boolean}
   *  + true: data just only contain numbers
   *  + false: data contain string
   */
  getJsonValues = tco(function (treeData, chart) {
    //var listValues = list;
    if (treeData instanceof Array) {
      for (var i = 0; i < treeData.length; i++) {
        if (typeof treeData[i] === "object" && treeData[i]) {
          getJsonValues(treeData[i], chart);
        } else {
          chart.listValues.push(treeData[i]);
        }
      }
    } else {
      for (var prop in treeData) {
        if (typeof treeData[prop] === "object" && treeData[prop]) {
          getJsonValues(treeData[prop], chart);
        } else {
          chart.listValues.push(treeData[prop]);
        }
      }
    }
    //return listValues;
  });
  /**
   * Validate json values
   * @param {type} jsonValues
   * @returns {Boolean}
   */
  function validateJsonValues(jsonValues) {
    for (var i = 0; i < jsonValues.length; i++) {
      if (!$.isNumeric(jsonValues[i]))
        return false;
    }
    return true;
  }

  /**
   * Render function
   * @param {type} containerElement
   * @param {type} containerWidth
   * @param {type} containerHeight
   * @returns {undefined}
   */
  FlowChart.prototype.render = function (containerWidth, containerHeight) {
    if (this.validate()) {
      
      this.initialize(containerWidth, containerHeight);
      // convert data
      this.convertData(this.io);
      // create chart header
      this.createChartHeader();
      // create Flow Chart
      this.createFlowChart();
      //resize(containerElement);
      return this.svg_dom;
    } else {
      window.alert("error");
      return null;
    }
  };

  /**
   * resize chart follow action resize layout of user
   * @param {Object} containerElement - element which contain chart
   * @method resize
   * @memberOf FlowChart
   */
  /*function resize(containerElement) {
    var chart_el = $(containerElement),
      svg = chart_el.find('svg')[0],
      bbox = svg.getBBox();
    svg.setAttribute("viewBox", [bbox.x - 20, bbox.y - 20, bbox.width + 40, bbox.height + 40]);
    svg.width.baseVal.valueAsString = chart_el.width();
    svg.height.baseVal.valueAsString = chart_el.height();
  }*/

  /**
   * initialize function
   * @param {type} containerWidth
   * @param {type} containerHeight
   * @returns {undefined}
   */
  FlowChart.prototype.initialize = function (containerWidth, containerHeight) {
    // define width and height of drawing area
    // set width, height
    this.width = containerWidth;
    this.height = containerHeight;
    // init margin
    this.margin = {top: 100, right: 100, bottom: 100, left: 50};
    // init tooltip
    this.tooltip = new CustomTooltip("tooltip", 200);
    // init color
    this.color = d3.scale.category20();
    // init chart's data
    this.treeMode = false;
    this.treeData = null;
    this.nodes = null;
    this.nodeData = null;
    this.linkData = null;
    this.sankey = null;
    this.svg = null;
    // object hold color of each label
    this.colors = {};
  };

  /**
   * Convert received data to understandable data format
   * @method convertData
   * @param {type} io io object
   * @memberOf FlowChart
   */
  FlowChart.prototype.convertData = function (io) {
    var self = this,
      nodes = [],
      links = [],
      rawNodeData,
      rawLinkData,
      selection = [],
      ids = [];

    // get data which loaded from files
    self.treeData = io.tree;
    rawNodeData = io.nodes;
    rawLinkData = io.links;

    // get node data
    rawNodeData.forEach(function (d) {
      var node = {
        'name': d.name,
        'id': Number(d.node_id),
        'description': d.description
      };
      nodes.push(node);
      selection.push(d.name);
      ids.push(Number(d.node_id));
      self.colors[d.name] = self.color(d.name);
    });

    self.nodeData = nodes;

    // get link data
    rawLinkData.forEach(function (d) {
      var link = {
        'source': Number(d.source),
        'target': Number(d.target),
        'value': Number(d.value),
        'description': d.description
      };
      links.push(link);
    });

    self.linkData = links;

    self.io.setValue('setTreeMode', false);
    self.io.setDesigner('setTreeMode', {type: 'checkbox', name: 'Treemode'});

    self.io.setValue('changeColor', {label: selection[0], color: self.colors[selection[0]]});
    self.io.setDesigner('changeColor', {type: 'colorPicker', range: selection, 'ids': ids});
  };

  /**
   * create header of chart
   * @method createChartHeader
   * @param {type} containerElement
   * @memberOf FlowChart
   */
  FlowChart.prototype.createChartHeader = function () {
    var self = this;
      
    self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
      // create svg
      self.svg =  d3.select(self.svg_dom)
      .attr("class", "flowchart")
      .attr("width", self.width)
      .attr("height", self.height)
      .attr("viewBox", '0, 0, ' + self.width + ', ' + self.height)
      .attr("preserveAspectRatio", 'none')
      .append("g");
      //.attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
  };

  /**
   * create flow chart
   * @method createFlowChart
   * @memberOf FlowChart
   */
  FlowChart.prototype.createFlowChart = function () {
    var self = this,
      // get tree data
      treeData = self.treeData,
      tree = d3.layout.tree(),
      changeColor = self.io.getValue("changeColor");

    // get nodes
    self.nodes = tree.nodes(treeData);
    // create sankey
    self.sankey = new Sankey(self.width);
    self.sankey
      .nodeWidth(15)
      .nodePadding(10)
      .size([self.width, self.height]);
    // create according path
    self.path = self.sankey.link();

    // set data to links
    self.setTreeDataToLinkData(self.nodes);
    // add data for sankey object
    self.sankey.nodes(self.nodeData)
      .links(self.linkData)
      .layout(32);

    // add link to svg
    self.link = self.svg.append("g")
      .selectAll(".flowlink")
      .data(self.linkData)
      .data(self.linkData)
      .enter()
      .append("path")
      .attr("class", function (d) {
        if (d.tree === true) {
          return 'treelink';
        }
        else {
          return 'flowlink';
        }
      })
      .attr("id", function (d) {
        return d.source.id + "_" + d.target.id;
      })
      .attr("d", self.path)
      .style("stroke-width", function (d) {
        return Math.max(1, d.dy);
      })
      .on("mousedown", function () {
        d3.event.stopPropagation();
      })
      .on("mouseover", function (d) {
        self.highlightFlows(self, d);
      })
      .on("mouseout", function () {
        self.deselectFlows(self);
      })
      .on("contextmenu", function () {
        self.rightclick();
      });

    // add node to svg
    self.node = self.svg.append("g")
      .selectAll(".node")
      .data(self.nodeData)
      .enter().append("g").attr("class", "flownode")
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      })
      //.on("dblclick", self.showPopupSourceCode)
      .on("mousedown", function () {
        d3.event.stopPropagation();
      })
      .call(d3.behavior.drag()
        .origin(function (d) {
          return d;
        })
        .on("dragstart", function () { /*do nothing*/
        })
        .on("drag", function (d) {
          return self.dragmove(self, d, this);
        }));

    // create rect and tooltip for nodes
    self.node.append("rect")
      .attr("id", function (d) {
        return "flowrect-" + d.id;
      })
      .attr("height", function (d) {
        return (d.dy > 0) ? d.dy : 1;
      })
      .attr("width", self.sankey.nodeWidth())
      .style("fill", function (d) {
        //return d.color = self.color(d.id);
        return d.color = (changeColor.label === d.name) ? changeColor.color : self.colors[d.name];
      })
      .style("stroke", function (d) {
        return d3.rgb(d.color).darker(2);
      })
      .on("mouseover", function (d) {
        self.showDetails(self, d);
      })
      .on("mouseout", function () {
        self.hideDetails(self);
      });

    // add text for each node
    self.node.append("text")
      .attr("x", -6)
      .attr("y", function (d) {
        return d.dy / 2;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function (d) {
        return d.name;
      })
      .filter(function (d) {
        return d.x < self.width / 2;
      })
      .attr("x", 6 + self.sankey.nodeWidth())
      .attr("text-anchor", "start");
  };

  /**
   * set tree data into link data
   * @param {Object} treeNodes tree nodes of data
   * @method setTreeDataToLinkData
   * @memberOf FlowChart
   */
  FlowChart.prototype.setTreeDataToLinkData = function (treeNodes) {
    var self = this,
      tempLink,
      linkDataLength = self.linkData.length;  // current length of linkData

    for (var i = 0; i < linkDataLength; i++) {
      // filter item of linkData in treeNodes
      treeNodes.filter(function (node) {
        // if item appear in treeNodes then create new link and push into linkData
        if (self.linkData[i].source === node.source &&
          self.linkData[i].target === node.target) {
          tempLink = {
            'source': self.linkData[i].source,
            'target': self.linkData[i].target,
            'value': node.value,
            'tree': true
          };
          self.linkData.push(tempLink);
        }
      });
    }
  };

  /**
   * Highlight links which corresponding with data in additional tree
   * @param {Object} d element highlight
   * @param {type} chart
   * @method highlightFlows
   * @memberOf FlowChart
   */
  FlowChart.prototype.highlightFlows = function (chart, d) {
    var str = '',
      treeMode = chart.io.getValue("setTreeMode");
    curNode = [];

    // deselect selected links
    chart.deselectFlows(chart);

    if (treeMode === true) {
      // check current selected link exist in treeData or not
      var checkExist = false;
      for (i = 0; i < chart.nodes.length; i++) {
        // selected link exist in treeData
        if ((d.source.id === chart.nodes[i].source) &&
          (d.target.id === chart.nodes[i].target)) {
          // save current node
          curNode = chart.nodes[i];
          checkExist = true;
          break;
        }
      }

      // if current link existed in treeData then display related overlay tree
      if (checkExist === true) {
        // get parent and child of current link in tree data
        var parentLinks = [];
        var childLinks = [];

        parentLinks = chart.getParentOfTreelink(curNode, parentLinks);
        childLinks = chart.getChildOfTreelink(curNode, childLinks);

        // set all link to hide_link
        d3.selectAll('.flowlink').attr('class', 'hide_flowlink');

        // get all tree link
        var treeLinks = d3.selectAll(".treelink")[0];

        // check tree data with link which needed highlight
        for (i = 0; i < treeLinks.length; i++) {
          // highlight current link
          str = '';
          str = curNode.source + "_" + curNode.target;
          if ((treeLinks[i].id === str)) {
            // change class name of link to highlight by css
            treeLinks[i].className.baseVal = 'highlighted_flowlink';
          }

          // highlight parent of current link
          parentLinks.filter(function (p) {
            str = '';
            str = p.source + "_" + p.target;
            if ((treeLinks[i].id === str)) {
              // change class name of link to highlight by css
              treeLinks[i].className.baseVal = 'highlighted_flowlink';
            }
          });

          // highlight children of current link
          childLinks.filter(function (c) {
            str = '';
            str = c.source + "_" + c.target;
            if ((treeLinks[i].id === str)) {
              // change class name of link to highlight by css
              treeLinks[i].className.baseVal = 'highlighted_flowlink';
            }
          });
        }
      }
    }
    // show tooltip
    chart.showDetails(chart, d);
  };

  /**
   * get parent of current selected link
   * @param {Object} curLink current link is selected
   * @param {Object} allParent all parent
   * @method getParentOfTreelink
   * @memberOf FlowChart
   */
  FlowChart.prototype.getParentOfTreelink = function (curLink, allParent) {
    // if current link has parent and target of parent is current link
    if (curLink.parent && curLink.parent.target === curLink.source) {
      // create data
      var parentObj = {
        "source": curLink.parent.source,
        "target": curLink.parent.target
      };

      // save the parent
      allParent.push(parentObj);

      // search for more parent
      var moreParent = this.getParentOfTreelink(curLink.parent, allParent);

      // if parent existed then save to parent array
      if (moreParent.length > 0) {
        allParent.push(moreParent);
      }

    }
    else {
      // do nothing
    }

    // return parent array of current link
    return allParent;
  };

  /**
   * get child of tree link
   * @param {Object} curLink current link is selected
   * @param {Object} allChild all childrent
   * @method getChildOfTreelink
   * @memberOf FlowChart
   */
  FlowChart.prototype.getChildOfTreelink = function (curLink, allChild) {
    // if current link has child
    if (curLink.children) {
      var children = curLink.children;

      // check with each child of current link
      for (var i = 0; i < children.length; i++) {
        // create data
        var childObj = {
          "source": children[i].source,
          "target": children[i].target
        };

        // save chil to child array
        allChild.push(childObj);

        // search for more children
        var moreChild = this.getChildOfTreelink(children[i], allChild);

        // if child existed then save to child array
        if (moreChild.length > 0) {
          allChild.push(moreChild);
        }

      }
    }
    else {
      // do nothing
    }

    // return child array of current link
    return allChild;
  };

  /**
   * Display sourcecode in popup window
   * @param {Object} d element occur to show popup
   * @method showPopupSourceCode
   * @memberOf FlowChart
   */
  FlowChart.prototype.showPopupSourceCode = function (d) {
    var location = "data/sourcecode/main.c";
    var markup = {start: 10, end: 50};
    $('#view_source_code').bPopup({
      content: 'iframe', //'ajax', 'iframe' or 'image'
      iframeAttr: 'scrolling="auto" frameborder="0"',
      contentContainer: '.content',
      loadUrl: 'source_code.html?' + encodeURIComponent(location) + '&' + markup.start + '&' + markup.end, //Uses jQuery.load()
      speed: 650,
      transition: 'slideIn',
      transitionClose: 'slideUp'
    });
  };

  /**
   * the function for moving the nodes
   * @param {type} chart
   * @param {type} d element to drag
   * @param {type} svg container contain this element
   * @returns {undefined}
   */
  FlowChart.prototype.dragmove = function (chart, d, svg) {
    d3.select(svg).attr("transform", "translate(" +
      (d.x = Math.max(0, Math.min(chart.width - d.dx, d3.event.x))) +
      "," + (d.y = Math.max(0, Math.min(chart.height - d.dy, d3.event.y))) + ")");
    chart.sankey.relayout();
    chart.link.attr("d", chart.path);
  };

  /**
   * Change attribute of highlighted link or hide link to normal
   * @method deselectFlows
   * @param {type} chart
   * @memberOf FlowChart
   */
  FlowChart.prototype.deselectFlows = function (chart) {
    // reset to normal link
    d3.selectAll('.highlighted_flowlink').attr('class', 'treelink');
    d3.selectAll('.hide_flowlink').attr('class', 'flowlink');
    // hide tooltip
    chart.hideDetails(chart);
  };

  /**
   * Show tooltips
   * @param {type} chart
   * @param {type} data
   */
  FlowChart.prototype.showDetails = function (chart, data) {
    // Hold content of tooltip
    var content = "";

    if (data.hasOwnProperty("sourceLinks")) {
      content = "<span class=\"name\">Source :</span><span class=\"value\"> " + data.name + "</span><br/>";
    }
    else {
      content = "<span class=\"name\">Source :</span><span class=\"value\"> " + data.source.name + "</span><br/>";
      content += "<span class=\"name\">Target :</span><span class=\"value\"> " + data.target.name + "</span><br />";
    }

    content += "<span class=\"name\">Value :</span><span class=\"value\"> " + data.value + "</span><br />";
    content += "<span class=\"name\">Description :</span><span class=\"value\"> " + data.description + "</span><br />";

    return chart.tooltip.showTooltip(content, d3.event);
    return chart.tooltip.showTooltip(content, d3.event);
  };

  /**
   * Hide tooltips
   * @param {type} chart
   * @returns {unresolved}
   */
  FlowChart.prototype.hideDetails = function (chart) {
    return chart.tooltip.hideTooltip();
  };

  /**
   * Display context menu for Flowchart
   * @method rightclick
   * @memberOf FlowChart
   */
  FlowChart.prototype.rightclick = function () {
    // Declare variable to hold position x and y when right click
    var x, y;

    if (d3.event.pageX || d3.event.pageY) {
      x = d3.event.pageX;
      y = d3.event.pageY;
    } else if (d3.event.clientX || d3.event.clientY) {
      x = d3.event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      y = d3.event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    if (d3.select(self.container).select("#flowchart-menu")[0][0] === null) {
      var ul = d3.select(self.container).append("div")
        .attr("id", "flowchart-menu")
        .attr("class", "custom-menu")
        .append("ul");

      ul.append("li")
        .text("&#x2716; Tree Mode");
    }

    // Show context menu
    d3.select("#flowchart-menu").style('position', 'absolute')
      .style('top', y + 'px')
      .style('left', x + 'px')
      .style('display', 'block');

    // Prevent default right click
    d3.event.preventDefault();

    // Hide context menu when click out side
    $(document).bind("click keyup", function (event) {
      d3.select("#flowchart-menu").style('display', 'none');
    });

    // Set event listener for item of context menu
    d3.select("#flowchart-menu")
      .selectAll("li")
      .on("click", function (d, i) {
        if (i === 0) {
          showPopupSourceCode(d);
        } else if (i === 1) {
          //alert(self.treeMode);
          // set tree mode on
          if (self.treeMode === true) {
            this.textContent = '\u2716 Tree Mode';
            self.treeMode = false;
            // unhighlight link when tree mode is OFF
            //self.deselectFlows();
          } else if (self.treeMode === false) {
            this.textContent = "\u2714 Tree Mode";
            self.treeMode = true;
          }
        } else {
          // do nothing
        }
      });
  };

  return FlowChart;
});
