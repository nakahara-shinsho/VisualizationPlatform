/**
 * @fileoverview implement for TableChart
 * @author Akira Kuroda
 * @version 5.0
 * @copyright Toshiba Corporation
 */

/** @module TableChart*/

/**
 * Initial config additional library files for this chart
 */

/**
 * Create TableChart main function
 * @class TableChart
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {TableChart}
 */
define(["util/CustomTooltip",
        "css!./style.css"], function (CustomTooltip) {
  /**
    * Constructor create TableChart
    * @method TableChart
    * @memberOf TableChart
    * @returns {TableChart}
    */
  var TableChart = function (io) {
    this.io = io;
  };

  /**
    * update chart according with changed of interface variables
    * @method TableChart
    * @memberOf TableChart
    * @returns {TableChart}
    */
  TableChart.prototype.update = function (changed) {
    var self = this;
    if(changed.hasOwnProperty("COLOR_MANAGER")){
      //self.redraw();
    }else if(changed.hasOwnProperty("DESIGN_MANAGER")){
      //self.redraw();
    }else if(changed.hasOwnProperty("DATA_MANAGER")){
      //self.redraw();
    }
  };

  /**
   * render Chart
   * @method render
   * @memberOf TableChart
   */
  TableChart.prototype.render = function (containerWidth, containerHeight) {
    var self = this;
    // initialize
    self.initialize(containerWidth, containerHeight);
    self.createHeader();
    self.createChart();
    return self.root_dom;
  };

  /**
   * redraw Chart
   * @method redraw
   * @memberOf TableChart
   */
  TableChart.prototype.redraw = function () {
    var self = this;
    self.createHeader();
    self.createChart();
    return self.root_dom;
  };
  /**
   * initialize
   * @method initialize
   * @memberOf TableChart
   */
  TableChart.prototype.initialize = function (containerWidth, containerHeight) {
    var self = this;
    self.margin = {top: 20, right: 20, bottom: 20, left: 20, scrollbar :16, tableHeader: 80};
    self.minimumColumnWidth = 150;
    /** Mode **/
    self._mode = "drilldown"; // ["highlight","drilldown"]
    self.containerWidth = containerWidth;
    self.containerHeight= containerHeight;

    self.width = self.containerWidth -
      self.margin.left - self.margin.right - self.margin.scrollbar;
    self.height = self.containerHeight -
      self.margin.top - self.margin.bottom;


    // Create Column Name
    self.columnNames = [];
    if(self.io.dataManager().getData()[0] !== undefined){
      for(var k in self.io.dataManager().getData()[0]){
        k = k.replace("(","_").replace(")","");
        self.columnNames.push(k);
      }
    }
    // Creawte Column Variation AND Create SelectedRows
    self.selectedRows = {};
    self.columnVariations = {};

    self.columnNames.forEach(function(d){
      self.columnVariations[d] = [];
      self.selectedRows[d]     = [];
    });
    self.io.dataManager().getData().forEach(function(row){
      for(var key in row){
        var tkey = key.replace("(","_").replace(")","");
        if(self.columnVariations[tkey].indexOf(row[key]) == -1){
          self.columnVariations[tkey].push(row[key]);
          self.selectedRows[tkey].push(row[key]);
        }
      }
    });

    // Create Default Width
    self.widthList = {};
    self.defaultColumnWidth = parseInt(self.width / self.columnNames.length);
    if(self.defaultColumnWidth < self.miniumColumnWidth){
      self.defaultColumnWidth = self.miniumColumnWidth.concat();
      self.width = self.defaultColumnWidth * self.columnNames.length;
    }
    self.columnNames.forEach(function(columnName){
      self.widthList[columnName] = self.defaultColumnWidth ;
    });

  };

  TableChart.prototype.resize =  function (containerWidth, containerHeight) {
    // update size
    var self = this;
    self.containerWidth  = containerWidth;
    self.containerHeight = containerHeight;
    self.width = self.containerWidth -
      self.margin.left - self.margin.right - self.margin.scrollbar;

    self.height = self.containerHeight -
      self.margin.top - self.margin.bottom;

    var  defaultColumnWidth = parseInt(self.width / self.columnNames.length);
    if(defaultColumnWidth < self.minimumColumnWidth){
      defaultColumnWidth = self.minimuColumnWidth;
    }
    for(var colName in self.widthList){
      if(self.defaultColumnWidth === self.widthList[colName]){
        self.widthList[colName] = defaultColumnWidth;
      }
    }
    self.defaultColumnWidth = defaultColumnWidth;
    self.width = self.defaultColumnWidth * self.columnNames.length;

    var bodyHeight = self.height - self.margin.tableHeader;
    self.tbody.style("height", bodyHeight + "px");
  };

  /**
   * create header of chart
   * @method createHeader
   * @memberOf TableChart
   */
  TableChart.prototype.createHeader = function () {
    var self = this;
    // Initialize
    if(self.root_dom === undefined){
      self.root_dom   = self.root_dom  = document.createElement("div");
      self.container = d3.select(self.root_dom);
    }
    if(self.container.selectAll("div.table")){
      self.container.selectAll("div.table").remove();
    }
    var div = self.container.append("div")
          .attr("class","table")
          .style("margin-left",  self.margin.left+ "px")
          .style("margin-top",  self.margin.top+ "px");
    var width = self.containerWidth -
          self.margin.left -
          self.margin.right +"px";
    // Define Div
    var mainDiv = div.append("div").attr("class","scrollable")
      .style("width", width);
    var table = mainDiv.append("table")
          .attr("class", "table table-striped table-condensed table-bordered table-hover")
          .attr("data-resizable-columns-id", "sample");
    self.thead = table.append("thead")
      .style("display","block");
    var bodyHeight = self.height - self.margin.tableHeader;
    self.tbody = table.append("tbody")
      .style("display","block")
      .style("height", bodyHeight +"px")
      .style("overflow-y","scroll");
  };

  /**
   * create bar chart depend on selected items by user
   * @method creatChart
   * @memberOf TableChart
   */
  TableChart.prototype.createChart = function () {
    var self = this;
    // Table Head
    self.headers = self.thead.append("tr")
      .selectAll("th#header")
      .data(self.columnNames)
      .enter()
      .append("th").attr("class","header")
      .attr("data-resizable-column-id",function(d){return d;})
      .style("width", function(d){
        return self.widthList[d] +"px";
      });
    self.headers.text(function(d){return d;});

    // Sorting Button
    var div = self.headers.append("div");
    div.append("a")
      .attr("id", function(d){ return "ascending_"+d;})
      .attr("class", "btn btn-primary btn-xs ascending-order sort")
      .text("昇順")
      .on("click", function(d){
        d3.selectAll("a.btn-info.ascending-order.sort")
          .attr("class", "btn btn-primary btn-xs ascending-order sort");
        d3.selectAll("a.btn-info.descending-order.sort")
          .attr("class", "btn btn-primary btn-xs descending-order sort");
        d3.select(this).attr("class", "btn btn-info btn-xs ascending-order sort");
        self.updateBody(d,"ascending-order");
      });
    div.append("a")
      .attr("id", function(d){ return "descending_"+d;})
      .attr("class", "btn btn-primary btn-xs descending-order sort")
      .text("降順")
      .on("click", function(d){
        d3.selectAll("a.btn-info.ascending-order.sort")
          .attr("class", "btn btn-primary btn-xs ascending-order sort");
        d3.selectAll("a.btn-info.descending-order.sort")
          .attr("class", "btn btn-primary btn-xs descending-order sort");
        d3.select(this).attr("class", "btn btn-info btn-xs descending-order sort");
        self.updateBody(d,"descending-order");
      });

    // Filter Dropdown List
    drawDropdown();
    // Table Body
    self.tbody
      .selectAll("tr")
      .data(self.io.dataManager().getData())
      .enter()
      .append("tr")
      .selectAll("td")
      .data(function(row){
        return d3.entries(row);
      })
      .enter()
      .append("td")
      .attr("id", function(d){return d.key.replace("(","_").replace(")","");})
      .attr("data-resizable-column-id",function(d){
        return d.key.replace("(","_").replace(")","");})
      .style("width", function(d){
        return self.widthList[d.key.replace("(","_").replace(")","")] +"px";
      })
      .text(function(d){return d.value;});

    function drawDropdown(){
      /// 1. Create Dropdown List
      var dropdiv = self.headers.append("div")
            .attr("id", function(d){ return d;})
            .append("select")
            .attr("class","select")
            .attr("multiple","multiple")
            .attr("id", function(d){ return d;})
            .selectAll("option")
            .data(function(d){return self.columnVariations[d];})
            .enter()
            .append("option")
            .attr("value", function(d) {return d;})
            .text(function(d){return d;});

      var height = (self.height - self.margin.tableHeader)/2;
      self.columnNames.forEach(function(colName){
        $(self.root_dom).find("#"+colName).click(function(e){
          if(self.container.selectAll("div#"+colName).selectAll("ul.init")[0].length == 0){
            self.container.selectAll("div#"+colName).selectAll("ul")
              .attr("class","multiselect-container dropdown-menu init");
            self.container.selectAll("div#"+colName).selectAll("li")
              .attr("class","active");
            self.container.selectAll("div#"+colName).selectAll("input")
              .attr("checked","checked");
          }
          $(self.root_dom).find("#"+colName + " input").change(function(e2){
            if(e2.currentTarget.checked){
              self.selectedRows[colName].push(e2.currentTarget.value);
            }else{
              var index = self.selectedRows[colName].indexOf(e2.currentTarget.value);
              self.selectedRows[colName].splice(index,1);
            }
            self.updateDisplayRows();
          });
          if($(e.currentTarget).find("div.btn-group.open").length === 0){
            self.columnNames.forEach(function(closeColName){
              $(self.root_dom).find("#"+closeColName+" div.btn-group")
                .attr("class", "btn-group");
              $(self.root_dom).find("#"+closeColName+" ul")
                .css("height", height+"px")
                .css("overflow", "auto");
            });
            $(e.currentTarget).find("div.btn-group")
              .attr("class", "btn-group open");
          }else{
            $(e.currentTarget).find("div.btn-group.open")
              .attr("class", "btn-group");
          }
          e.stopPropagation();
        });
      });
      /// 2. ALL Select Button
      div.append("a")
        .attr("id", function(d){ return "all_select";})
        .attr("class", "btn btn-primary btn-xs all_select")
        .text("全選択")
        .on("click", function(d){
          self.selectedRows[d] = self.columnVariations[d].concat();
          self.container.selectAll("div#"+d).selectAll("input")
            .attr("id", function(){
              if(d3.select(this)[0][0].checked === false){
                $(d3.select(this)[0][0]).trigger("click");
              }
              return null;
            });
          self.updateDisplayRows();
        });
      div.append("a")
        .attr("id", function(d){ return "all_unselect";})
        .attr("class", "btn btn-primary btn-xs all_select")
        .text("全選択解除")
        .on("click", function(d){
          self.selectedRows[d] = [];
          self.container.selectAll("div#"+d).selectAll("input")
            .attr("id", function(){
              if(d3.select(this)[0][0].checked === true){
                $(d3.select(this)[0][0]).trigger("click");
              }
              return null;
            });
          self.updateDisplayRows();
        });
    }
  };

 /**
   * update display rows
   * @method displayRows
   * @memberOf TableChart
   */
  TableChart.prototype.updateDisplayRows = function () {
    var self = this;

    self.container.selectAll("tr")
      .style("display", function(d){
        if(d !== undefined){
          for(var key in self.selectedRows){
            if(self.selectedRows[key].indexOf(d[key]) === -1){
              return "none";
            }
          }
        }
        return "block";
      });
  };

  /**
   * mode Selector by user
   * @method mode
   * @memberOf TableChart
   */
  TableChart.prototype.mode = function (mode) {
    if(mode){
      this._mode = mode;
      this.redraw();
    }
    return this._mode;
  };
  /**
   * Update Body
   * @method updateBody
   * @memberOf TableChart
   */
  TableChart.prototype.updateBody = function(id, order){
    var self = this;
    self.tbody.selectAll("*").remove();
    var sortedData =
          self.io.dataManager()
          .getData()
          .sort(function(a,b){
            if(order === "ascending-order"){
              if( parseInt(a[id]) > parseInt(b[id])) return -1;
              if( parseInt(a[id]) < parseInt(b[id]) ) return 1;
              return 0;
            }else if(order === "descending-order"){
              if( parseInt(a[id]) > parseInt(b[id]) ) return 1;
              if( parseInt(a[id]) < parseInt(b[id]) ) return -1;
              return 0;
            }
            return 0;
          });
    self.tbody
      .selectAll("tr")
      .data(sortedData)
      .enter()
      .append("tr")
      .selectAll("td")
      .data(function(row){
        return d3.entries(row);
      })
      .enter()
      .append("td")
      .attr("id", function(d){return d.key;})
      .style("width", function(d){
        return self.widthList[d.key] +"px";
      })
      .text(function(d){return d.value;});
  };
  return TableChart;

});
