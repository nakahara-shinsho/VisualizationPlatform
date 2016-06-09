/**
 * @fileOverview implement for TextTreeTable
 * @author ThongKN - modifier
 * @version 1.1
 * @copyright TSDV
 */

/**
 * Create TextTreeTable main function
 * @class TextTreeTable
 * @param {type} toggle toggleTextTreeTable class
 * @returns {TextTreeTable}
 */
define(["./ToggleTextTreeTable", "css!./TextTreeTable"], function (ToggleTextTreeTable) {
  /**
   * Constructor
   * @class TextTreeTable
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {TextTreeTable}
   */
  var TextTreeTable = function (io) {
    this.io = io;
    this.toggle = new ToggleTextTreeTable();
    this.io.setValue({
      groupRadio: []
    });
  };

  /**
    * update chart according with changed of interface variables
    * @method TextTreeTable
    * @memberOf TextTreeTable
    * @returns {TextTreeTable}
    */
  TextTreeTable.prototype.update = function (changedAttr) {
    var self = this;
    // if Radio Group is changed
    if(changedAttr.hasOwnProperty("groupRadio")){
      var groupRadio = changedAttr.groupRadio;
      if(groupRadio === "Expand All") {
        this.toggle.expandAllRows(self);
      } else if(groupRadio === "Collapse All") {
        this.toggle.collapseAllRows(self);
      }
    }
  };

  /**
   * render Text Tree Table
   * @method render
   * @memberOf TextTreeTable
   */
  TextTreeTable.prototype.render = function ( containerWidth, containerHeight) {
    // initialize
    this.initialize(containerWidth, containerHeight);
    // convert data
    this.convertData(this.io.data);
    // create chart header
    this.createChartHeader();
    // create Text Tree Table
    this.createTextTree();
    return this.root_dom;
  }

  /**
   * resize chart follow action resize layout of user
   * @param {Object} containerElement - element which contain chart
   * @method resize
   * @memberOf TextTreeTable
   */
  TextTreeTable.prototype.resize = function (containerWidth, containerHeight) {
    this.width = containerWidth;
    this.height = containerHeight;
    $(this.root_dom).find(".treetable").css({'width' : this.width, 'height' : 10 + this.height});
  };


  /**
   * initialize
   * @method initialize
   * @memberOf TextTreeTable
   */
  TextTreeTable.prototype.initialize = function (containerWidth, containerHeight) {
    // define width and height of drawing area
    // set width, height
    this.width        = containerWidth;
    this.height       = containerHeight;
    // set margin
    this.margin       = {top: 50, right: 150, bottom: 100, left: 100};
    // init data array for text tree
    this.textTreeData = [];
    this.isCollapse = true;
  }

  /**
   * Convert received data to understandable data format for self chart
   * @method convertData
   * @memberOf TextTreeTable
   */
  TextTreeTable.prototype.convertData = function (data) {
    // get data
    this.textTreeData = data;
    var self      = this,
        radiosName = ['Expand All', 'Collapse All'];

    // set value after converted data for interface variables
    self.io.setValue('groupRadio',  radiosName[1]);
    // set scope for interface variables
    self.io.setDesigner('groupRadio', {type: "radios", name: "radioGroup", range: radiosName});
  }

  /**
   * create header of chart
   * @method createChartHeader
   * @memberOf TextTreeTable
   */
  TextTreeTable.prototype.createChartHeader = function () {
    var self = this;
    this.root_dom = document.createElement("div");
    
    this.d3div = d3.select(this.root_dom)
      .attr("class", "texttreetable")
      .attr("align", "center")
      .attr("style", "overflow-x: auto; overflow-y: auto; height:" + self.height + "px; width:" + self.width + "px;");

    // create link for Expand
    this.d3div.append("a")
      //.attr("onclick", "expandAllRows()")
      .attr("style", "padding-right: 10px")
      .text("Expand All")
      .on("click", this.toggle.expandAllRows.bind(this.toggle, this));

    // create link for Collapse
    this.d3div.append("a")
      //.attr("onclick", "collapseAllRows()")
      .text("Collapse All")
      .on("click", this.toggle.collapseAllRows.bind(this.toggle, this));

    // create main table
    var tbl = this.d3div.append("table")
      .attr("id", "maintable")
      .attr("width", "80%");
    // create table header
    tbl.append("th")
      .attr("width", "44%")
      .text("Name");

    tbl.append("th")
      .text("Type");

    tbl.append("th")
      .text("Size");
  }

  /**
   * call function to create text tree table
   * @method createTextTree
   * @memberOf TextTreeTable
   */
  TextTreeTable.prototype.createTextTree = function () {
    var self = this,
    // get main table
        tbl  = this.d3div.select('table#maintable')[0][0];
    // create tree table with data
    createTextTreeTable(tbl, 0, 0, self.textTreeData);

    /**
     * Create tree table with created table and id
     * @memberOf TextTreeTable
     * @method createTextTreeTable
     * @private
     * @param {Object} tbl
     * @param {Object} id
     * @param {Object} level
     * @param {Object} curDir
     */
    function createTextTreeTable(tbl, id, level, curDir) {
      // if current directory has child
      if (curDir.children) {
        // append  current directory to table
        var parentId = createRow(tbl, id, level, curDir),

        // get child of current directory
        children = curDir.children;

        // check with each child of current directory
        for (var i = 0; i < children.length; i++) {
          // recursive to check until meet last child
          createTextTreeTable(tbl, parentId, i + 1, children[i]);
        }
      }
      else {
        // append new row with current directory which does not contain any child
        createRow(tbl, id, level, curDir);
      }
    }

    /**
     * append row to specify table with data and id
     * @method createRow
     * @memberOf TextTreeTable
     * @private
     * @param {Object} mainTable table want to add each row
     * @param {Object} id id of row
     * @param {Object} level level of row
     * @param {Object} data input data to this row
     */
    function createRow(mainTable, id, level, data) {
      // insert new row
      var row = mainTable.insertRow(-1),
      // set level
          checkLevel = [],
          display    = false;

      // if current directory or file is root
      if (level === 0) {
        // set id for new row
        row.id = id;
      }
      else {
        // set id for new row with level
        row.id = id + "-" + level;
        // get level after set id
        checkLevel = row.id.split("-");
        display = true;
      }

      // set class name for new row
      row.className = 'a';
      // set display
      if (display === true) row.style.display = 'none';

      // create associate cell
      var cell1 = row.insertCell(0), // Name
          cell2 = row.insertCell(1), // Type
          cell3 = row.insertCell(2); // Size

      // append row for directory
      if (data.type === 'directory') {
        cell1.innerHTML = '<div class="tier' + (checkLevel.length) + '"><a onclick="this.toggle.toggleRows(this);" class="folder-close"></a>' + data.name + '</div>';
        cell2.innerHTML = data.type;
        cell3.innerHTML = '--';
      }
      // append row for file
      else {
        cell1.innerHTML = '<div class="tier' + (checkLevel.length) + '"><a class="doc"></a>' + data.name + '</div>';
        cell2.innerHTML = data.type;
        cell3.innerHTML = data.size;
      }
      // return id of current directory or file
      return row.id;
    }

    window.onload = function () {
      collapseAllRows();
    };
    /**
     * collapse all row of Text Tree Table
     * @method collapseAllRows
     * @memberOf TextTreeTable
     * @private
     */
    function collapseAllRows() {
      var rows = document.getElementsByTagName("TR");
      for (var j = 0; j < rows.length; j++) {
        var r = rows[j];
        if (r.id.indexOf("-") >= 0) {
          r.style.display = "none";
        }
      }
    }
  }


  return TextTreeTable;
});
