/**
 * Initial config additional library files for this chart
 * @fileOverview implement for ChangeImpactChart
 * @author HienBT
 * @version 1.1
 * @copyright TSDV
 */

/**
 * Create ChangeImpactChart main function
 * @param {type} CustomTooltip
 * @returns {undefined}
 */
define(["util/tooltip/OldTooltip", "css!./changeimpactchart"], function (CustomTooltip) {
  /**
   * Constructor create Change Impact Chart
   * @class ChangeImpactChart
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {ChangeImpactChart}
   */
  var ChangeImpactChart = function (io) {
    this.io = io;
    // init interface variables for this chart
    this.io.setValue({
      'changeImpactTreeMode': false
    });
  };

  /**
   * update chart according with changed of interface variables
   * @method ChangeImpactChart
   * @memberOf ChangeImpactChart
   * @returns {ChangeImpactChart}
   */
  ChangeImpactChart.prototype.update = function (changedAttr) {
    var self = this;

    // if treeMode changed
    if (changedAttr.hasOwnProperty("changeImpactTreeMode")) {
      // Set treemode value such as checkbox value in control panel
      self.treeMode = changedAttr.changeImpactTreeMode;
    }
  };
  /**
   * Validate input data after drawing chart
   *    If return true: Data is valid
   *    Else: Data is invalid
   * @returns {Boolean}
   */
  ChangeImpactChart.prototype.validate = function () {
    var cis_marks = this.io.cis_mark,
      cis_tree = this.io.cis_tree,
      scs_tree_details = this.io.scs_tree_detail,
      scs_tree = this.io.scs_tree;
    // check data empty or not
    if (cis_marks.length === 0 || scs_tree_details.length === 0) {
      return false;
    } else {
      var cis_treeValues = getCisTreeValues(cis_tree, []);
      var scs_treeValues = getScsTreeValues(scs_tree, []);
      var checkData =validateCisMark(cis_marks)
        && validateScsTreeDetails(scs_tree_details)
        && validateJsonValues(cis_treeValues, scs_treeValues);
      if (!checkData) {
        return false;
      }
    }
    return true;
  };

  /**
   * Check cis_marks data
   * @param {type} cis_marks
   * @returns {Boolean}
   *  + true: data just only contain numbers
   *  + false: data contain string
   */
  function validateCisMark(cis_marks) {
    // Check cis_marks data
    var marksHeader = Object.keys(cis_marks[0]);
    for (var i = 0; i < cis_marks.length; i++) {
      var row = cis_marks[i];
      if (!$.isNumeric(row[marksHeader[0]])) {
        return false;
      }
    }
    return true;
  }
  /**
   * Check scs_tree_details data
   * @param {type} scs_tree_details
   * @returns {Boolean}
   *  + true: data just only contain numbers
   *  + false: data contain string
   */
  function validateScsTreeDetails(scs_tree_details) {
    // Check scs_tree_details data
    var treeHeader = Object.keys(scs_tree_details[0]);
    for (var i = 0; i < scs_tree_details.length; i++) {
      var row = scs_tree_details[i];
      if (!$.isNumeric(row[treeHeader[0]])
        || !$.isNumeric(row[treeHeader[3]])) {
        return false;
      }
    }
    return true;
  }
  /**
   * Get cis_tree values data
   * @param {object} cis_tree - JSon data
   * @param {Array} list
   * @returns {Boolean}
   *  + true: data just only contain numbers
   *  + false: data contain string
   */
  function getCisTreeValues(cis_tree, list) {
    var listValues = list;
    if (cis_tree instanceof Array) {
      for (var i = 0; i < cis_tree.length; i++) {
        if (typeof cis_tree[i] === "object" && cis_tree[i]) {
          getCisTreeValues(cis_tree[i], listValues);
        } else {
          listValues.push(cis_tree[i]);
        }
      }
    } else {
      for (var prop in cis_tree) {
        if (typeof cis_tree[prop] === "object" && cis_tree[prop]) {
          getCisTreeValues(cis_tree[prop], listValues);
        } else {
          listValues.push(cis_tree[prop]);
        }
      }
    }
    return listValues;
  }

  /**
   * Check scs_tree data
   * @param {object} scs_tree - JSon data
   * @param {Array} list
   * @returns {Boolean}
   *  + true: data just only contain numbers
   *  + false: data contain string
   */
  function getScsTreeValues(scs_tree, list) {
    var listValues = list;
    if (scs_tree instanceof Array) {
      for (var i = 0; i < scs_tree.length; i++) {
        if (typeof scs_tree[i] === "object" && scs_tree[i]) {
          getScsTreeValues(scs_tree[i], listValues);
        } else {
          listValues.push(scs_tree[i]);
        }
      }
    } else {
      for (var prop in scs_tree) {
        if (typeof scs_tree[prop] === "object" && scs_tree[prop]) {
          getScsTreeValues(scs_tree[prop], listValues);
        } else {
          listValues.push(scs_tree[prop]);
        }
      }
    }
    return listValues;
  }
  /**
   * Validate jsons values which was convert to values array data
   * @param {type} cis_treeJson
   * @param {type} scs_treeJson
   * @returns {Boolean}
   */
  function validateJsonValues(cis_treeJson, scs_treeJson) {
    for (var i = 0; i < cis_treeJson.length; i++) {
      if (!$.isNumeric(cis_treeJson[i]))
        return false;
    }
    for (var i = 0; i < scs_treeJson.length; i++) {
      if (!$.isNumeric(scs_treeJson[i]))
        return false;
    }
    return true;
  }

  /**
   * Render to ChangeImpactChart
   * @method render
   * @memberOf ChangeImpactChart
   */
  ChangeImpactChart.prototype.render = function ( containerWidth, containerHeight, params) {
    if (this.validate()) {
     
      // initialize function
      this.initialize(containerWidth, containerHeight);
      // convert data
      this.convertData(this.io);
      // create header of chart
      this.createChartHeader();
      // create chart
      this.createChangeImpactChart();
      return this.svg_dom;
    } else {
      window.alert("Chart data error!");
      return null;
    }
  };

  /**
   * initialize function
   * @param {type} containerWidth
   * @param {type} containerHeight
   */
  ChangeImpactChart.prototype.initialize = function (containerWidth, containerHeight) {
    // define width and height of drawing area
    // set width, height
    this.width = containerWidth;
    this.height = containerHeight;
    // init margin
    this.margin = {top: 100, right: 100, bottom: 100, left: 50};
    // init tooltip
    this.tooltip = new CustomTooltip("tooltip", 240);
    // set default tree mode
    this.treeMode = false;
    // init data variable
    this.scs_tree = null;
    this.scs_tree_details = null;
    this.cis_marks = null;
    this.cis_tree = null;
    // init svg
    this.svg = null;
  }

  /**
   * convert data
   * @param {object} io - object contains data
   */
  ChangeImpactChart.prototype.convertData = function (io) {
    var self = this;
    this.cis_tree = io.cis_tree;
    this.cis_marks = io.cis_mark;
    this.scs_tree = io.scs_tree;
    this.scs_tree_details = io.scs_tree_detail;

    self.io.setValue('changeImpactTreeMode', false);
    self.io.setDesigner('changeImpactTreeMode', {type: 'checkbox', name: 'Treemode'});
  }

  /**
   * create header of chart
   * @param {string} containerElement
   */
  ChangeImpactChart.prototype.createChartHeader = function () {
    var self = this;
    self.svg_dom = document.createElementNS(d3.ns.prefix.svg, 'svg');
    // create svg
    self.svg =  d3.select(self.svg_dom)
      .attr('class', 'changeimpactchart')
      .attr("width", self.width)
      .attr("height", self.height)
      .append("g")
      .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
  }

  /**
   * create change impact chart
   */
  ChangeImpactChart.prototype.createChangeImpactChart = function () {
    var self = this,
      w = self.width,
      h = self.height,
      x = self.xScale = d3.scale.linear().range([0, w]),
      y = self.yScale = d3.scale.linear().range([0, h]),
      vis = self.svg,
      partition = d3.layout.partition(),
      bundle = d3.layout.bundle(),
      root = self.scs_tree,
      root_details = self.scs_tree_details,
      cis_tree_data = self.cis_tree,
      cis_marks_data = self.cis_marks,
      nodes = partition.nodes(root),
      cis_tree = d3.layout.tree(),
      cis_nodes = cis_tree.nodes(cis_tree_data),
      cis_node_ids = [],
      cis_links = cis_tree.links(cis_nodes),
      cis_bundle = bundle(cis_links),
      linkData = [],
      cis_tree_depth = null,
      markerID = [],
      cis_tree_overlay;

    // For display tree when mouseover into this node_id
    for (var i = 0; i < cis_nodes.length; i++) {
      cis_node_ids.push(cis_nodes[i].node_id);
    }
    // Make tree data
    for (var i = 0; i < cis_bundle.length; i++) {
      var source = nodes[cis_bundle[i][0].node_id],
        target = nodes[cis_bundle[i][1].node_id],
        tmp_node = {}; // For only curve

      source.cis_tree_level = cis_bundle[i][0].depth;
      tmp_node.dx = (source.dx);
      tmp_node.dy = (source.dy);
      tmp_node.x = (Math.abs(source.x - target.x) / 2) * 1.1;
      tmp_node.y = (Math.abs(source.y - target.y) / 2) * 1.1;
      linkData.push([source, target]); // If curve
    }
    // get tree depth
    cis_tree_depth = getTreeDepth(cis_nodes);

    /**
     * calculate the depth of the tree.
     * @param {Object} localNodes all nodes to compute depth of tree
     * @method getTreeDepth
     * @memberOf ChangeImpactChart
     * @private
     */
    function getTreeDepth(localNodes) {
      var depth = 0;

      for (var i = 0; i < localNodes.length; i++) {
        if (localNodes[i].depth > depth) {
          depth = localNodes[i].depth;
        }
      }

      return depth;
    }

    for (var i = 0; i < cis_tree_depth; i++) {
      markerID.push("marker" + i);
    }

    // Merge Structure and Detail Change Impact
    nodes.forEach(function (node) {
      var result = root_details.filter(function (detail) {
        return detail.node_id == node.node_id;
      });

      if (result.length !== 0) {
        node.type = result[0].type;
        node.name = result[0].name;
        node.value = result[0].value;
        node.diff = result[0].diff;
      } else {
        // Currently do nothing
      }
    });

    // Draw main chart
    var g = vis.selectAll("g")
      .data(partition.nodes(root))
      .enter().append("svg:g")
      .attr("transform", function (d) {
        return "translate(" + x(d.y) + "," + y(d.x) + ")";
      })
      .on("click", click);

    var kx = w / root.dx,
      ky = h / 1;

    g.append("svg:rect")
      .attr("width", root.dy * kx)
      .attr("height", function (d) {
        return d.dx * ky;
      })
      .attr("class", function (d) {
        return d.children ? "cic parent" : "cic child";
      })
      .style("fill", color)
      .style("stroke", function (d) {
        if (d.diff && d.diff != "trace") {
          return "red";
        }
      })
      .style("stroke-width", function (d) {
        if (d.diff && d.diff != "trace") {
          return "2px";
        }
      })
      .on("mouseover", function (d, i) {
        if (self.treeMode) {
          return displayOverlayTree(d);
        } else {
          return show_tooltips(d, i, this);
        }
      })
      .on("mouseout", function (d, i) {
        if (self.treeMode) {
          return hideOverlayTree(d);
        } else {
          return hide_tooltips(d, i, this);
        }
      })
      .on("contextmenu", $.proxy(rightclick, self));


    g.append("svg:text")
      .attr("transform", transform)
      .attr("dy", ".35em")
      .style("opacity", function (d) {
        return d.dx * ky > 12 ? 1 : 0;
      })
      .style("font-weight", function (d) {
        return d.diff ? "900" : "normal";
      })
      .text(function (d) {
        return d.name;
      });

    d3.select(window).on("click", function () {
      click(root, this);
    });

    // Define defs for marker-end (to make arrow for end-line)
    vis.append("svg:defs")
      .selectAll("marker")
      .data(markerID)
      .enter().append("svg:marker")
      .attr("id", String)
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 5)
      .attr("refY", 5)
      .attr("markerUnits", "strokeWidth")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("svg:polyline")
      .attr("fill", "black")
      .attr("stroke", "black")
      .attr("points", "0,0 10,5 0,10 0,0");

    var clickItem = root;

    /**
     * draw line with arrow for overlay tree mode
     * @param {Object} d data for draw this line
     * @method line_arrow
     * @memberOf ChangeImpactChart
     * @private
     */
    function line_arrow(d) {
      var source = 0,
        source_x = 0,
        source_y = 0,
        target = 0,
        target_x = 0,
        target_y = 0,
        dx = 0,
        dy = 0,
        dr = 0;

      source = d[0];
      target = d[1];

      source_x = x(source.y) + clickItem.dy * kx / 2;
      source_y = y(source.x) + source.dx * ky / 2;

      target_x = x(target.y) + clickItem.dy * kx / 2;
      target_y = y(target.x) + target.dx * ky / 2;

      dx = target_x - source_x;
      dy = target_y - source_y;
      dr = Math.sqrt(dx * dx + dy * dy);

      return "M" + source_x + "," + source_y + "A" + (dr) + "," + (dr) + " 0 0,1 " + target_x + "," + target_y;
    }

    /**
     * Show Change Impact Tree when mouseover of the element that want to display at tree mode on.
     * @param {Object} d element for display overlay tree
     * @method displayOverlayTree
     * @memberOf ChangeImpactChart
     * @private
     */
    function displayOverlayTree(d) {
      if (cis_node_ids.indexOf(d.node_id) > -1) {
        cis_tree_overlay = vis.selectAll(".link").data(linkData)
          .enter()
          .append("path")
          .attr("class", "cis-link")
          .attr("d", line_arrow)
          .attr("marker-end", function (d) {
            return "url(#marker" + d[0].cis_tree_level + ")";
          });
      }
    }

    /**
     * Hide Change Impact Tree when mouseout of the element that want to display at tree mode on.
     * @param {Object} d element for hide overlay tree
     * @method hideOverlayTree
     * @memberOf ChangeImpactChart
     * @private
     */
    function hideOverlayTree(d) {
      if (cis_tree_overlay !== undefined) {
        cis_tree_overlay.remove();
      }
    }

    /**
     * Perform action when click to a block in chart
     * @param {Object} d element for click
     * @param {Object} object object for this element
     * @method click
     * @memberOf ChangeImpactChart
     * @private
     */
    function click(d, object) {
      clickItem = d;
      if (!d.children)
        return;
      
      //self.io.setValue('_NEXTSCREEN_', d.children);
      
      //test the screen transition functionality
      
      kx = (d.y ? w - 40 : w) / (1 - d.y);
      ky = h / d.dx;
      x.domain([d.y, 1]).range([d.y ? 40 : 0, w]);
      y.domain([d.x, d.x + d.dx]);

      var t = g.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .attr("transform", function (d) {
          return "translate(" + x(d.y) + "," + y(d.x) + ")";
        });

      t.select("rect")
        .attr("class", "cic")
        .attr("width", d.dy * kx)
        .attr("height", function (d) {
          return d.dx * ky;
        });

      t.select("text")
        .attr("class", "cic_text")
        .attr("transform", transform)
        .style("opacity", function (d) {
          return d.dx * ky > 12 ? 1 : 0;
        });

      if (cis_tree_overlay !== undefined) {
        var to = cis_tree_overlay.transition()
          .duration(d3.event.altKey ? 7500 : 750);
        to.attr("d", line_arrow);
      }

      d3.event.stopPropagation();
    }

    /**
     * Perform transform element when call
     * @param {Object} d element to transform
     * @method transform
     * @memberOf ChangeImpactChart
     * @private
     */
    function transform(d) {
      return "translate(8," + d.dx * ky / 2 + ")";
    }

    /**
     * Display sourcecode in popup window
     * @param {Object} d element occur to show popup
     * @method showPopupSourceCode
     * @memberOf ChangeImpactChart
     * @private
     */
    function showPopupSourceCode(d) {
      var file = d;
      if (d.parent === undefined) {
        return;
      } else {
        while (file.depth !== 1) {
          file = file.parent;
        }
      }

      var location = "data/sourcecode/" + file.name;
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
    }

    /**
     * Perform action when right click on a block of chart.
     * @param {Object} d element that show context menu
     * @method rightclick
     * @memberOf ChangeImpactChart
     * @private
     */
    function rightclick(d) {
      var x, y,
        self = this,
        thisNode = d;

      if (d3.event.pageX || d3.event.pageY) {
        x = d3.event.pageX;
        y = d3.event.pageY;
      }
      else if (d3.event.clientX || d3.event.clientY) {
        x = d3.event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = d3.event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }

      // Show context menu
      d3.select("#changeimpactchart-menu")
        .style('position', 'absolute')
        .style('top', y + 'px')
        .style('left', x + 'px')
        .style('display', 'block');

      // Prevent default right click
      d3.event.preventDefault();

      // Hide context menu when click out side
      $(document).bind("click keyup", function (event) {
        d3.select("#changeimpactchart-menu").style('display', 'none');
      });

      // Set event listener for item of context menu
      d3.select("#changeimpactchart-menu")
        .selectAll("li")
        .on("click", function (d, i) {
          if (i === 0) {
            showPopupSourceCode(thisNode);
            self.treeMode = false;
          }
          else if (i === 1) {
            // go to selected node of Gantt Chart
            // thisNode.name
            var tmp = "node_432";
            var existingNode = document.getElementById(tmp);

            // check node is existing or not
            if (existingNode) {
              var anchor = this.getElementsByTagName("A")[0];
              // jump to selected node in Gantt Chart
              anchor.href = "#" + tmp;

              // refer to selected node
              POLYSPECTOR.referToGanttChart(existingNode);
            }
          }
          else if (i === 2) {
            // set tree mode on
            if (self.treeMode === true) {
              this.textContent = '\u2716 Change impact tree mode';
              if (cis_tree_overlay !== undefined) {
                cis_tree_overlay.remove();
              }
              self.treeMode = false;
            }
            else if (self.treeMode === false) {
              this.textContent = "\u2714 Change impact tree mode";
              self.treeMode = true;
            }
          }
        });
    }

    /**
     * Color for each block in chart
     * @param {Object} d element that set color
     * @method color
     * @memberOf ChangeImpactChart
     * @private
     */
    function color(d) {
      // Fill color by cis_mark.csv
      var currentNode = cis_marks_data.filter(function (mark) {
        return mark.node_id == d.node_id;
      });

      if (currentNode.length > 0) {
        return currentNode[0].color;
      } else {

        if (d.diff && d.diff == "trace") {
          return "orange";
        } else if (d.type == "TOP") {
          if (d.diff) {
            return "red";
          } else {
            return "lightpink";
          }
        } else if (d.type == "LOOP") {
          if (d.diff) {
            return "green";
          } else {
            return "lightgreen";
          }
        } else if (d.type == "COND") {
          if (d.diff) {
            return "blue";
          } else {
            return "lightblue";
          }
        } else if (d.type == "FILE") {
          if (d.diff) {
            return "yellow";
          } else {
            return "lightyellow";
          }
        } else if (d.type == "ROOT") {
          if (d.diff) {
            return "purple";
          } else {
            return "plum";
          }
        }
      }
    }

    /**
     * Show tooltip when mouseover the block at treemode off
     * @param {Object} data data of element
     * @param {Object} i index of element
     * @param {Object} element element show tooltip
     * @method show_tooltips
     * @memberOf ChangeImpactChart
     * @private
     */
    function show_tooltips(data, i, element) {
      d3.select(element).attr("stroke", "red");
      var content = "<span class=\"name\">Name: " + data.name + "</span><br/><span class=\"type\">Type: " + data.type + "</span>";
      return self.tooltip.showTooltip(content, d3.event);
    }

    /**
     * Hide tooltip when mouseout the block at treemode off
     * @param {Object} data data of element
     * @param {Object} i index of element
     * @param {Object} element element show tooltip
     * @method hide_tooltips
     * @memberOf ChangeImpactChart
     * @private
     */
    function hide_tooltips(data, i, element) {
      d3.select(element).attr("stroke", "none");
      return self.tooltip.hideTooltip();
    }
  }

  return ChangeImpactChart;
});