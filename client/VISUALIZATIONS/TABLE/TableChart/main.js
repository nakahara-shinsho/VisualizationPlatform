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
    // Data Mapper
    this.io.dataManager().setMapperProps({
	primaryKeyString: {type: 'string', label: 'Primary Key String', map2: []}
    });
    // Design Manager
    this.io.designManager()
      .setControl("InitSelectNum", {type: "regx", name: "Init Select Number", value:0});
    this.io.designManager()
      .setControl("SelectLimit", {type: "regx", name: "Select Number Limit", value:10});
    this.io.designManager()
      .setControl("ClickedColor", {type: "regx", name: "Clicked Color", value:"#f8c059"});
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
      if(self.io.designManager().getValue("ClickedColor").length == 7){
        self.redraw();
      }
    }else if(changed.hasOwnProperty("DATA_MANAGER")){
      if(!self.selfClick){
        self.redraw();
        self.resetRowRefiner();
      }
      self.selfClick = false;
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
    self.initSelect();
    return self.root_dom;
  };

  /**
   * redraw Chart
   * @method redraw
   * @memberOf TableChart
   */
  TableChart.prototype.redraw = function () {
    var self = this;

    // Update tbody
    self.container.selectAll("tbody").remove();
    var bodyHeight = self.height - self.margin.tableHeader;
    self.tbody = self.container.select("table")
      .append("tbody")
      .style("display","block")
      .style("height", bodyHeight +"px")
      .style("overflow-y","scroll");

    // Update tbody
    self.createTbody();
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
      self.rowConfig = {width : 120};
    self.minimumColumnWidth = 150;
    self.selfClick = false;
    self.initSelectFilter = {};

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
        self.columnNames.push(k);
      }
    }
    // Create Column Variation AND Create SelectedRows
    self.selectedRows = {};
      self.columnVariations = {};

    self.columnNames.forEach(function(d){
      self.columnVariations[d] = [];
      self.selectedRows[d]     = [];
    });
    self.io.dataManager().getData().forEach(function(row){
      for(var key in row){
        if(self.columnVariations[key].indexOf(row[key]) == -1){
          self.columnVariations[key].push(row[key]);
          self.selectedRows[key].push(row[key]);
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

    // Reset Row Refiner
    self.resetRowRefiner();
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
    self.container.select("div.scrollable")
	  .style("width", self.width +"px")
	  .style("height", self.height+"px");
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
    if(self.container.select("table")[0].length > 0){
      self.container.select("table").remove();
    }
    var div = self.container.append("div")
          .attr("class","table")
          .style("margin-left",  self.margin.left+ "px")
          .style("margin-top",  self.margin.top+ "px");
    var width = self.containerWidth -
          self.margin.left -
          self.margin.right +"px";
    var height = self.containerHeight -
          self.margin.top -
          self.margin.bottom +"px";
    // Define Div
    var mainDiv = div.append("div").attr("class","scrollable")
	  .style("width", width)
	  .style("height", height)
	  .style("overflow-x","scroll")
	  .style("overflow-y","hidden");
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
   * create tbody
   * @method creatTbody
   * @memberOf TableChart
   */
  TableChart.prototype.createTbody = function () {
    var self = this;
    self.tbody
      .selectAll("tr")
      .data(self.io.dataManager().getData())
      .enter()
      .append("tr")
      .attr("id", function(d){
        var id = [];
        for(var k in d){
          id.push(d[k]);
        }
        if(id.length > 0){
          return id.join("__");
        }
        return null;
      })
      .selectAll("td")
      .data(function(row){
        return d3.entries(row);
      })
      .enter()
      .append("td")
      .attr("id", function(d){return d.key;})
      .attr("data-resizable-column-id",function(d){
        return d.key;})
      .style("width", function(d){
	return self.rowConfig.width + "px";
      })
      .text(function(d){return d.value;});
    // ROW CLICK
    self.tbody.selectAll("tr")
      .on("click",function(d){
        var filterCol = self.io.dataManager().getMapper("primaryKeyString")[0];
        var filters   = self.io.dataManager().getRowRefiner()[filterCol];
        if(filters == undefined ||
           filters.length  < self.io.designManager().getValue("SelectLimit") ||
           filters.indexOf(d[filterCol]) !== -1){
          self.selfClick = true;
          // Update Filter
      	  self.updateFilter(d);
          // Update Color
          self.updateColor();
        }
      });
  };
  /**
   * create chart
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
        return self.rowConfig.width +"px";
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
    var filterCols =
          self.io.dataManager().getMapper("primaryKeyString");
    self.createTbody();

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
   * update filter
   * @method updateFilter
   * @memberOf TableChart
  */
  TableChart.prototype.updateFilter = function (row) {
    var self = this;
    var currentFilter = self.io.dataManager().getRowRefiner();
    if(self.initSelectFilter !== undefined){
      currentFilter = self.initSelectFilter;
    }
    var newFilter     = {};
    var filterCols =
          self.io.dataManager().getMapper("primaryKeyString");
    filterCols.forEach(function(col){
      if(currentFilter[col] !== undefined &&
         currentFilter[col].indexOf(row[col]) !== -1){
        // alreay exist
        if(currentFilter[col].length == 1){
          newFilter[col] = null;
        }else{
          currentFilter[col].splice(currentFilter[col].indexOf(row[col]),1);
          newFilter[col] = currentFilter[col].concat();
        }
      }else{
        // not exist
        if(currentFilter[col] == undefined){
          newFilter[col] = [];
        }else{
          newFilter[col] = currentFilter[col].concat();
        }
        newFilter[col].push(row[col]);
      }
    });
    self.initSelectFilter = undefined;
    self.io.dataManager().setRowRefiner(newFilter);
  };
 /**
   * update color
   * @method updateColor
   * @memberOf TableChart
  */
  TableChart.prototype.updateColor = function() {
    var self = this;
    var clickedIds = [];
    var filters = self.io.dataManager().getRowRefiner();
    for(var key in filters){
      filters[key].forEach(function(d,i){
        if(clickedIds[i] == undefined){
          clickedIds[i] = d;
        }else{
          clickedIds[i] += "__"+d;
        }
      });
    };
    var color = self.io.designManager().getValue("ClickedColor");
    self.tbody.selectAll("tr")
      .style("background-color", function(){
        for(var i=0; i< clickedIds.length ; i++){
          if(d3.select(this).attr("id").indexOf(clickedIds[i]) !== -1){
            return color;
            break;
          }
        }
	return null;
      })
      .style("color", function(){
        for(var i=0; i< clickedIds.length ; i++){
          if(d3.select(this).attr("id").indexOf(clickedIds[i]) !== -1){
            return "white";
            break;
          }
        }
	return null;
      });

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
        return self.rowConfig.width + "px";
      })
      .text(function(d){return d.value;});
  };
 /**
   * Reset RowRefiner
   * @method resetRowRefiner
   * @memberOf TableChart
   */
  TableChart.prototype.resetRowRefiner = function(){
    var self = this;
    var filter = self.io.dataManager().getRowRefiner();
    var newFilter = {};
    for(var k in filter){
      newFilter[k] = null;
    }
    self.io.dataManager().setRowRefiner(newFilter);
    console.log("== RESET ==");
    console.log(self.io.dataManager().getRowRefiner());
  };
 /**
   * Init Select
   * @method initSelect
   * @memberOf TableChart
   */
  TableChart.prototype.initSelect = function(){
    var self = this;
    self.resetRowRefiner();
    var num = self.io.designManager().getValue("InitSelectNum");
    var color = self.io.designManager().getValue("ClickedColor");
    if(num > 0){
      var filterCols = self.io.dataManager().getMapper("primaryKeyString");
      filterCols.forEach(function(col){
        self.initSelectFilter[col] = [];
      });
      self.tbody.selectAll("tr")
        .style("background-color", function(d,i){
          if(i < num){
            filterCols.forEach(function(col){
              self.initSelectFilter[col].push(d[col]);
            });
            return color;
          }
          return null;
        })
        .style("color", function(d,i){
          if(i < num){
            filterCols.forEach(function(col){
              self.initSelectFilter[col].push(d[col]);
            });
            return "white";
          }
          return null;
        });
    }else{
      self.initSelectFilter = undefined;
    }
  };
  return TableChart;

});
