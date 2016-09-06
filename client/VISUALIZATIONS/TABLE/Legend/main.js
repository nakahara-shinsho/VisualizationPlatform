9/**
 * @fileOverview implement for Legend
 */

/**
 * Create Legend main function
 * @class Legend
 * @param {type} AxisSelectable AxisSelectable class
 * @param {type} CustomTooltip CustomTooltip class
 * @returns {Legend}
 */
define(["css!./Legend"], function () {
  /**
   * Constructor create Legend
   * @class Legend
   * @param {ChartModel} io - model of chart which extend from Backbone.Model
   * @returns {Legend}
   */

  const OPACITYON = 1.0;
  const OPACITYOFF = 0.1;
  const textSelector = "セレクター";
  const textExclusiveSelector = "排他的セレクター";
  const textGroupSelector = "グループセレクター";

  var Legend = function (io) {
      var self = this;
    this.io = io;

   this.io.setHighlightMode();

    this.io.dataManager().setMapperProps({
	parameters: { label: 'Parameters from',type: 'number', map2: []}
    });
    this.io.designManager()
      .setControl("RegisteredGroupName", {type:"regx", name:"Register Group Name", value:""});
    this.io.designManager()
      .setControl(textSelector, {type:"radio", name:textSelector, range:["show","hide"], value: "hide"});
    this.io.designManager()
      .setControl(textExclusiveSelector, {type:"radio", name:textExclusiveSelector, range:["show","hide"], value: "hide"});
    this.io.designManager()
      .setControl(textGroupSelector, {type:"radio", name:textGroupSelector, range:["show","hide"], value: "hide"});
    this.io.designManager()
      .setControl("ShowSelectorsBox", {type:"radio", name:"ShowSelectorsBox", range:["show","hide"], value: "hide"});
  };
  /**
   * update chart according with changed of interface variables
   * @method Legend
   * @memberOf Legend
   * @returns {Legend}
   */
  Legend.prototype.update = function (changedAttr) {
    if(changedAttr.hasOwnProperty("DATA_MANAGER")) {
	if(changedAttr.DATA_MANAGER.SELECTOR == undefined) {
	    this.initializeDataPanel();
	    this.redraw();
	} else if (changedAttr.DATA_MANAGER.SELECTOR  && changedAttr.DATA_MANAGER.SELECTOR.MAPPER) {
	    this.initializeDataPanel();
	    this.redraw();
	}
    } else if (changedAttr.hasOwnProperty("DESIGN_MANAGER")) {   
      this.initializeDataPanel();
      this.redraw();
    } else 
    if(changedAttr.hasOwnProperty("COLOR_MANAGER") ) {
      this.redraw();
    } else  {//MODE change
        this.redraw();
    }
    
  };

  /**
   * redraw Legend
   * @method redraw
   * @memberOf Legend
   */
   Legend.prototype.redraw = function() {
       this.height = this.containerHeight;
       this.initializeDesignPanel();
       this.createHeader();
       var data = this.transformData();
       this.drawLegend(data);
  };
 
  /**
   * render Legend
   * @method render
   * @memberOf Legend
   */
  Legend.prototype.render = function (containerWidth, containerHeight) {

    this.initialize(containerWidth, containerHeight);          
    // create chart header
    this.createHeader();
    var data = this.transformData();
    if (data != null) {
	this.drawLegend(data);    
    }
    return this.svg_dom;      
    
  };
  /**
   * transform data into dataset for lengend
   * @method transformData
   * @memberOf Legend
   */
  Legend.prototype.transformData = function () {
      var self = this, singleData=[], exclusiveData = {};
      var groupData = {};
      var data = self.io.dataManager().getData();

      if (data.length == undefined) {
	  groupData = makeGroupFromObject(data);
      } else {
	  keys = self.io.dataManager().getMapper("parameters");
	  if(_.isEmpty(keys)) return null;
	  keys.forEach(function (key) {    
	      var id = parseInt(self.io.designManager().getValue(key + "ID"), 10);
	      var set={name: key, groupID : id};
	      var groups = self.searchGroupFromKey(key);
	      var group;
	      if (groups != null) {
		  groups.forEach(function (group) {
		      if (groupData[group.label] == undefined) {
			  groupData[group.label] = [];		     
		      } 
		  });
	      }
	      set.values = data.filter(function(row){
		  return row[key] !== undefined || !isNaN(row[key]);
	      });
	      if (groups != null) {
		  /*groupDataに登録*/
		  groups.forEach(function (group) {
		      groupData[group.label].push({kind: "data", data: set});
		  });
	      } 
	      if (id) {
		  /*exclusiveDataに登録*/
		  if (!exclusiveData[id]) {
		      exclusiveData[id] = [];
		      exclusiveData[id].push(set);
		  } else {
		      exclusiveData[id].push(set);
		  }
	      }
	      /*全データをsingleDataに登録*/
	      singleData.push(set);
	  });               
	  /*groupDataを階層的な構造に変換*/
	  createGroupStructure(groupData);
      }
      /*最上位のgroupDataをselfに保持*/
      self.groupHead = groupData;
      return [singleData, exclusiveData, groupData];

      function makeGroupFromObject(data) {
	  var GroupData = {},
	      obj,
	      subGroupData;
	  Object.keys(data).forEach(function (groupName) {
	      GroupData[groupName] = [];
	      data[groupName].forEach(function (d) {
		  if (typeof d != "object") {
		      obj = {};
		      obj.kind = "data";
		      obj.data = {name: d, groupID: 0, values: []};
		      GroupData[groupName].push($.extend(true, {}, obj));
		  } else {
		      obj = {};
		      obj.kind = "group";
		      obj.data = makeGroupFromObject(d);		  
		      GroupData[groupName].push($.extend(true, {}, obj));
		  }
	      });
	  });
	  return GroupData;
      }
      function createGroupStructure(groupData) {
	  var groupName;
	  var mapperProps;
	  var index;
	  var map2;
	  var obj;
	  var caller = [];
	  mapperProps = self.io.dataManager().getMapperProps();
	  groupName = Object.keys(mapperProps).map(function (key) {return key});
	  index = groupName.indexOf("parameters");
	  if (index != -1) {
	      groupName.splice(index, 1);
	  };
	  groupName.forEach(function (name) {
		  if (groupData[name] == undefined) {
		      groupData[name] = [];
		  }
	      });
	  groupName.forEach(function (name) {
		  map2 = mapperProps[name].map2;
		  map2.forEach(function (d) {
			  index = groupName.indexOf(d);
			  if (index != -1) {
			      obj = {};
			      obj[d] = groupData[d];
			      if (name == d) {
				  console.error("Irregal Grouping");
			      } else {
				  obj[d].push(
				      {kind: "parent", name: name});
				  groupData[name].push(
				      {kind: "group", data: obj});			      
				  caller.push(d);
			      }
			  }
		      });
	      });
	  caller.forEach(function (name) {
		  delete groupData[name];
	      });
      }
  };

  /**
   * search group from key
   * @method searchGroupFromKey
   * @memberOf Legend
   */
  Legend.prototype.searchGroupFromKey = function (key) {
      var self = this;
      var mapperProps = self.io.dataManager().getMapperProps();
      var element;
      var groups = [];
      Object.keys(mapperProps).forEach (function (k) {
	      if (k == "parameters") {
		  /*do nothing*/
	      } else {
		  /*parameters以外のMappされたGroupが対象*/
		  element = mapperProps[k].map2;
		  element.forEach (function (ele) {
			  if (key == ele) {
			      groups.push(mapperProps[k]);
			  }
		      });		  
	      }
	  });
      return groups;
  };

  /**
   * initialize
   * @method initialize
   * @memberOf Legend
   */
  Legend.prototype.initialize = function (containerWidth, containerHeight) {
      
      // set width, height
      this.containerWidth  = containerWidth;
      this.containerHeight = containerHeight;

      this.width = this.containerWidth - 10;
      this.height = this.containerHeight ;
      this.selectorHeight = this.height;
      this.exclusiveSelectorHeight = this.height;
      this.groupSelectorHeight = this.height;
      // init for others      
      this.svg = null;
      this.svg_g = null;
      this.root_dom  = undefined;
      this.container = undefined;
      this.initializeDesignPanel();
      this.initializeDataPanel();
  };

  /**
   * initialize DesignPanel;
   * @method initializeDesignPanel
   * @memberOf Legend
   */
  Legend.prototype.initializeDesignPanel = function () {
      var keys = this.io.dataManager().getMapper("parameters");
      var i;
      var temp = this.io._RenderStatus_;
      if (keys == undefined) {
	  return;
      }
      this.io._RenderStatus_ = null; 
　　　//this.io._RenderStatus_があると、setControlの初期化ができないため、一時的に退避
      for (i = 0; i < keys.length; i++) {
	  this.io.designManager()
	      .setControl(keys[i] + "ID", {type:"regx", name:keys[i] + "ID", value: 0});	  

      };
      this.io._RenderStatus_ = temp;
  };

  /**
   * initialize DataPanel;
   * @method initializeDataPanel
   * @memberOf Legend
   */
  Legend.prototype.initializeDataPanel = function () {
      var self = this;
      var mapperProps = this.io.dataManager().getMapperProps();
      var groups = this.io.designManager().getValue("RegisteredGroupName").split(/\s+/);
      var newObj = {};
      groups.forEach(function(g) {
	      var obj = {};
	      if (g != "") {
		  obj[g] = { label: g, type: 'number', map2: []};
		  newObj = $.extend({},newObj, obj);
	      }
	      var data = self.io.dataManager()._getInferData("_dataTypes_");
	      data[g] = "number";
	      self.io.dataManager()._setInferData("_dataTypes_", data);
      });
      
      this.io.dataManager().setMapperProps(
	  $.extend({},mapperProps, newObj));
  };
    /**
     * create header of chart
     * @method createHeader
     * @memberOf Legend
     */
   Legend.prototype.createHeader = function () {
       var self = this;

       if(self.svg_dom == undefined){
	   self.svg_dom = document.createElement("div");
       }
       self.svg =  d3.select(self.svg_dom)
           .attr('class', 'legend');

       if(self.svg.select("g")){
	   self.svg.select("g").remove();
       }
       self.svg_g = self.svg.append("g");      
   };

  /**
   * draw ExclusiveSelectors
   * @method drawExclusiveSelectors
   * @memberOf Legend
   */
  Legend.prototype.drawExclusiveSelectors = function (svg_g, data) {      
      var self = this;
      var size = [0, 0];
      calcSvgSize(data, size);
      self.updateSvgSize(svg_g.select(".svg-exclusiveSelector"), size);
      self.updateSvgSize(svg_g.select(".svg-exclusiveSelector-cols"), size);
      drawConnections(svg_g, data);
      drawCircles(svg_g, data);
      function calcSvgSize(group, size) {
	  size[0] = self.width / 2;
	  size[1] = data.length * 30;
      }
      function drawConnections(svg_g, data) {
	  var i, sum, larray;
	  var group;
	  var keys = Object.keys(data);
	  var line = d3.svg.line()
	      .interpolate('basis')
	      .x(function(d) {return d[0];})
	      .y(function(d) {return d[1];});
	  sum = 0;
	  for (i = 0; i < keys.length; i++) {
	      group = svg_g.select(".svg-exclusiveSelector")
		  .append('g')
		  .attr('class', "exclusiveCircle");

	      larray = [[30, (sum + 1) * 30],
			[20, (sum + 1) * 30],
			[20, (sum + data[keys[i]].length)*30], 
			[30, (sum + data[keys[i]].length)*30]];
	      group.append('path')
		  .attr({
			  'd': line(larray),
			      'stroke': 'white',
			      'stroke-width': 2,
			      });
	      for (j = 0; j < data[keys[i]].length; j++) {	  
		  sum++;
		  group.append("circle")
		      .attr("class", data[keys[i]][j].name)
		      .attr("cx", self.width / 2  - 20)
		      .attr("cy",(sum) * 30)
		      .attr("r",8)
		      .style("fill-opacity", OPACITYOFF)
		      .style("fill", function (d) {
			      return self.io.colorManager().getColorOfColumn(data[keys[i]][j].name);
			  })
		      .append('g').attr("class", "unselected-legend");
	      };
	  };
	  
      }
      function drawCircles(svg_g, data) {
	  var group;
	  var circles;
	  var addedKey;
	  var cols;
	  var removedElements;
	  group = svg_g.select(".svg-exclusiveSelector")
	  .selectAll(".exclusiveCircle");
	  group[0].forEach(function(d) {
		  circles = d;
		  d3.select(circles).select("circle").style("fill-opacity", OPACITYON);
		  removedElements = d3.select(circles).selectAll("circle");
		  
		  addedKey = d3.select(circles).select("circle").attr("class"); 
		  cols = self.io.dataManager().getColumnRefiner();
		  cols = self.removeElements(cols, removedElements[0]);
		  cols = self.addElement(cols, addedKey);
		  self.sendDatas(cols);
		  d3.select(circles).selectAll("circle")
		      .on("click", function(){
			      d3.select(circles).selectAll("circle")
				  .style("fill-opacity", OPACITYOFF)
				  .select("g").attr("class", "unselected-legend");
			      changeStatus(this, circles);
			  });      		  
	      });

      }
      function changeStatus(circle, group) {
	  var removedElements = [];
	  var dom;
	  var addedKey;
	  var cols;
	  var legendClass = d3.select(circle).select("g").attr("class");
	  if (legendClass === "selected-legend") {
	      d3.select(circle).select("g").attr("class", "unselected-legend");
	      d3.select(circle).style("fill-opacity", OPACITYOFF);
	  } else {
	      d3.select(circle).select("g").attr("class", "selected-legend");
	      d3.select(circle).style("fill-opacity", OPACITYON);
	      dom = d3.select(group).selectAll("circle");
	      addedKey = d3.select(circle).attr("class"); 
	      cols = self.io.dataManager().getColumnRefiner();
	      dom[0].forEach(function (d) {
		      removedElements.push(d3.select(d).attr("class"));
		  });
	      cols = self.removeElements(cols, removedElements);
	      cols = self.addElement(cols, addedKey);
	      self.sendDatas(cols);	      
	  }
      }
  };

  /**
   * remove "elements" from src;
   * @method removeElements
   * @memberOf Legend
   */
  Legend.prototype.removeElements = function (src, elements) {
      var index;
      elements.forEach(function (d) {
	      index = src.indexOf(d);
	      if (index != -1) {
		  src.splice(index, 1);
	      };	      
	  });
      return src;
  };

  /**
   * add "elements" to src;
   * @method addElements
   * @memberOf Legend
   */
  Legend.prototype.addElements = function (src, elements) {
      var self = this;
      elements.forEach(function (ele) {
	     src = self.addElement(src, ele) ;
	  });
      return src;
  };

  /**
   * add one "element" to src;
   * @method addElement
   * @memberOf Legend
   */
  Legend.prototype.addElement = function (src, element) {
      var index;
      index  = src.indexOf(element);
      if (index == -1) {
	  src.push(element);
      };
      return src;
  };

  /**
   * sendData using "setColumnRefiner" function
   * @method sendDatas
   * @memberOf Legend
   */
  Legend.prototype.sendDatas = function(datas) {
      var self = this;
      if (datas.length > 0) {
	  /*force to send refiner data instead of setColumnRefiner*/
	  self.io.dataManager()._writeColumnRefiner(datas, {silent: false} ); 
      };
  };

  /**
   *
   *
   */
  Legend.prototype.updateSvgSize = function(svg, size) {
      svg.style("width", function(){
	      return size[0]   +"px";
	  })
	  .style("height",   function(){
		  return size[1] + "px";
	      });
  };
  /**
   * draw hierarchical group selectors
   * @method drawGroupSelectors
   * @memberOf Legend
   */
  Legend.prototype.drawGroupSelectors = function (svg, groups) {
      var self = this;
      var offset = [10, 10], vals = [];
      var sum = [1, 0];
      var size = [0, 0];
      calcSvgSize(groups, sum);
      size[0] = sum[0] * 100;
      size[1] = sum[1] * 30;
      self.updateSvgSize(svg.select(".svg-groupSelector-cols"), size);
      var svg_g = svg.select(".svg-groupSelector").append("g");
      Object.keys(groups).forEach(function (name) {
	      if (groups[name]){
		  offset = drawSelectiveCircle(svg_g, groups, name, offset);
	      }
      });
      function calcSvgSize(groups, sum) {
	  Object.keys(groups).forEach(function(key) {
		  sum [1]++
		  groups[key].forEach(function(group) {
			  if (group.kind == "data") {
			      sum [1]++
			  } else if (group.kind == "group") {
			      sum [0]++
			      calcSvgSize(group.data, sum);
			  }
		      })
	      });
	  return sum;
      }
      function drawGroupRect(svg, groups, name) {
	  var svg_g = svg.select(".svg-groupRect")
	      .append("svg");
	  svg_g.append("rect")
	      .attr("x", 20)
	      .attr("y", 30)
	      .attr("width", 15)
	      .attr("height",15)
	      .style("fill", "white");
      }
      function drawSelectiveCircle(svg_g, groups, name, offset) {
	  var selectedOrUnselected;
          var d3Name = self.getName4D3(name);
	  offset[1] += 30; 
	  svg_g.append("circle")
	  .attr("class", d3Name)
	  .attr("cx", offset[0])
	  .attr("cy", offset[1])
	  .attr("r",8)
	  .style("fill-opacity",  function() {
		  return setOpacity(groups, name);
	      })
	  .style("fill", "white")
	  .on("click", function(){
	      showGroupCol(groups[name]);
	      clickSelectiveCircle(svg_g, groups, name);
	      vals[0] = offset[0];
	      vals[1] = offset[1] + 30;	  
	      drawNamesFromGroup(svg_g, groups[name], [offset[0], offset[1]]);
	      })	  
	  ;	  
	  svg_g.append("text")
	  .text(name)
	  .attr("class", name)
	  .attr("x", offset[0] + 10)
	  .attr("y", offset[1] + 4)
	  .attr("font-family", "sans-serif")
	  .style("fill", "white")
	  ;
	  return offset;
      }
      function showGroupCol(group) {
	  var svgT =  self.svg_g.select(".svg-groupSelector-cols");
	  var position = [30, 40];
	  var colorManager = self.io.colorManager();
	  var color = d3.scale.category20().range();
	  var colorCounter = 0;

	  self.svg_g.select(".svg-groupSelector-cols")
	      .selectAll("text")
	      .remove();
	  self.svg_g.select(".svg-groupSelector-cols")
	      .selectAll("rect")
	      .remove();
	  drawColName(svgT, group, position);
	  function drawColName(svg, group ,position) {
	      group.forEach(function (g) {
		  if (g.kind == "data") {
		      var rect = svg.append("rect")
		      	  .attr("x", position[0] - 15)
			  .attr("y", position[1] - 15)
			  .attr("width",15)
			  .attr("height",15)
			  .style("fill", function(){
			      return color[colorCounter % 20];
			  })
			  .style("fill-opacity", 1)
			  .on("click", function(d,i){
			      var onOff = d3.select(this).select("g");
			      if (onOff[0][0] != null) {
				  d3.select(this).style("fill-opacity", 0.1);
				  d3.select(this).select("g").remove();
				  var refiner = self.io.dataManager().getColumnRefiner();
				  refiner = self.removeElements(refiner, ["", g.data.name]);
				  self.sendDatas(refiner);
			      } else {
				  d3.select(this).style("fill-opacity", 1);
				  d3.select(this).append("g").attr("class", "on");
				  var refiner = self.io.dataManager().getColumnRefiner();
				  refiner = self.removeElements(refiner, [""]);
				  refiner = self.addElement(refiner, g.data.name);
				  self.sendDatas(refiner);
			      }
			  })
			  .append("g").attr("class", "on");
		      svg.append("text")
			  .text(g.data.name)
			  .attr("x", position[0])
			  .attr("y", position[1])
			  .attr("font-family", "sans-serif")
			  .style("fill", function() {
			    return color[colorCounter++ % 20];
			  });
		      position[1] += 30;
		  } else if (g.kind == "group") {
		      Object.keys(g.data).forEach (function (key) {
			  drawColName(svg, g.data[key], position);
		      });		      
		  }
	      });
	  }
	  function getAllColumnInGroup(group, gCol) {
	      Object.keys(group).forEach(function(key) {
		  group[key].forEach(function(d) {
		      if (d.kind == "data") {
			  gCol[d.data.name] = 0;
		      } else if (d.kind == "group") {
			  getAllColumnInGroup(d.data, gCol);
		      }
		  });
	      });
	  }
      }
  
      function getColColor(index) {
        var colorManager = self.io.colorManager();
	var color =colorManager._themeColors["google 20c"];
	return color[index];
      }
      function setOpacity(groups, name) {
	  var selectiveGroups;
	  var keys;
	  selectiveGroups = getSelectiveGroupNames(groups, name);
	  keys = getKeysFromGroupName(selectiveGroups);	 
	  if (isIncludedInColumnRefiner(keys)) {
	      return OPACITYON;
	  } else {
	      return OPACITYOFF;
	  }
      }
      function isIncludedInColumnRefiner(keys) {
	  var flg;
	  var columns = self.io.dataManager().getColumnRefiner();
	  keys.forEach(function (k) {
		  flg = false;
		  columns.forEach(function (col) {
			  if (col == k) {
			      flg = true;
			  }
		      });
		  if (flg == false) {
		      return false;
		  }
	      });
	  return flg;
      }
      function drawNamesFromGroup(svg_g, group, offset) {
	  var svg_g_g;
	  var tmp;
	  svg_g_g = svg_g.append("g")
	  offset[0] += 10;
	  group.forEach( function (g) {
		  if (g.kind == "data") {
		      /*do nothing*/
		  } else if (g.kind == "group"){
		      Object.keys(g.data).forEach (function (key) {
			      tmp = offset[0];
			      /*draw circles hierarchically*/
			      drawSelectiveCircle(svg_g_g, g.data, key, offset);
			      offset[0] = tmp;
				  });
		  } else if (g.kind == "parent"){
		      /*do nothing*/
		  } else {
		      console.error("irregal group kind");
		  }		  
	      });
      } 
      function clickSelectiveCircle(svg_g, groups, name) {
	  var groupHead = self.groupHead;
	  var selectiveGroups;
	  selectiveGroups = getSelectiveGroupNames(groups, name);
	  switchOpacities(svg_g, selectiveGroups);
	  updateSelectiveGroup(groups[name]);
      }
      function updateSelectiveGroup(group) {
	  var keys = [];
	  var columns = [];
	  var allKeys = [];
	  getNamesFromGroup(group, keys);
	  columns = self.io.dataManager().getColumnRefiner();
	  allKeys = getAllKeys()
	  columns = self.removeElements(columns, allKeys);
	  columns = self.addElements(columns, keys);
	  self.sendDatas(columns);
      }
      function getNamesFromGroup(group, names) {
	  group.forEach( function (g) {
		  if (g.kind == "data") {
		      names.push(g.data.name);
		  } else if (g.kind == "group"){
		      Object.keys(g.data).forEach (function (key) {
			  getNamesFromGroup(g.data[key], names);
		      });
		  } else if (g.kind == "parent"){
		      /*do nothing*/
		  } else {
		      console.error("irregal group kind");
		  }		  
	      });	  
      }
      function switchOpacities(svg_g, selectiveGroups) {
	  var d3Name;

	  svg_g.selectAll("circle").style("fill-opacity", OPACITYOFF);
	  svg_g.select("g").selectAll("circle").remove();
	  svg_g.select("g").selectAll("text").remove();
	  svg_g.select("g").remove();

	  selectiveGroups.forEach(function (gName) {
	      d3Name = self.getName4D3(gName);
	      self.svg_g.selectAll("."+d3Name).style("fill-opacity", OPACITYON);		  	     
	      });
      }
      function getSelectiveGroupNames(groups, name) {
	  var innerGroups = [];
	  var outerGroups = [];	  
	  var selectiveGroups = [];
	  selectiveGroups.push(name);
	  innerGroups = getInnerGroups(groups[name], innerGroups);
	  selectiveGroups = selectiveGroups.concat(innerGroups);
	  outerGroups = getOuterGroups(groups[name], outerGroups);
	  selectiveGroups = selectiveGroups.concat(outerGroups);
	  return selectiveGroups;
      }
      function getAllKeys() {
	  var allGroups = [];
	  Object.keys(self.groupHead).forEach(function (headKey) {
		  allGroups.push(headKey);
		  allGroups = getInnerGroups(self.groupHead[headKey], allGroups)
	      });
	  var keys = getKeysFromGroupName(allGroups);
	  return keys;
      }
      function getKeysFromGroupName(selectiveGroups) {
	  var keys = [];
	  selectiveGroups.forEach (function (gName) {
		  var ret;
		  ret = self.searchGroupFromName(self.groupHead, gName, ret);
		  ret[gName].forEach(function (d) {
			  if (d.kind == "data") {
			      keys.push(d.data.name);
			  }
		      });
	      });
	  return keys;
      }
      function getInnerGroups(group, innerGroups) {
	  group.forEach(function (g) {
		  if (g.kind == "data") {
		      /*do nothing*/
		  } else if (g.kind == "group"){
		      Object.keys(g.data).forEach (function (key) {			      
			      innerGroups.push(key);		      
			      innerGroups = getInnerGroups(g.data[key], innerGroups);
			  });
		  } else if (g.kind == "parent"){
		      /*do nothing*/
		  } else {
		      console.error("irregal group kind");
		  }
	      });
	  return innerGroups;
      }
      function getOuterGroups(group, outerGroups) {
	  group.forEach(function (g) {
		  if (g.kind == "data") {
		      /*do nothing*/
		  } else if (g.kind == "group"){
		      /*do nothing*/
		  } else if (g.kind == "parent"){
		      outerGroups.push(g.name);
		      var ret = null;
		      ret = self.searchGroupFromName(self.groupHead, g.name, ret);
		      getOuterGroups(ret[g.name], outerGroups);
		  } else {
		      console.error("irregal group kind");
		  }
	      });
	  return outerGroups;
      }

  };

  /**
   * seach a group structure from group name
   * @method searchGroupFromName
   * @memberOf Legend
   */  
  Legend.prototype.searchGroupFromName = function (group, name, ret) {
      var self = this;
      var g = null;
      Object.keys(group).forEach(function (key) {
	      if (key == name) {
		  ret = group;
	      } else {
		  group[key].forEach(function (d) {
			  if (d.kind == "group") {
			      g = self.searchGroupFromName(d.data, name, ret);
			      if (g != null) {
				  ret = g;
			      }
			  }
		      });
	      }	      
	  });
      return ret;
  };

  /**
   * draw selectors
   * @method drawSelectors
   * @memberOf Legend
   */
  Legend.prototype.drawSelectors = function (svg_g, data) {
      var self = this;
      var size = [0, 0];
      calcSvgSize(data, size);
      self.updateSvgSize(svg_g.select(".svg-selector"), size);
      self.updateSvgSize(svg_g.select(".svg-selector-cols"), size);
      drawRectForAllColumns(svg_g, data);
      drawRects(svg_g, data);
      return;
      
      function calcSvgSize(data, size) {
	  size[0] = self.width / 2;
	  size[1] = data.length * 80;
      }
      function searchIndexOfKey(key)
      {
	  var cols = self.io.dataManager().getColumnRefiner();
	  var index  = cols.indexOf(key);
	  return index;
      }
      function switchOffAllColumns(svg_g, data) {
	  var cols, index;
	  svg_g.select(".svg-selector").selectAll("rect").selectAll("g").attr("class", "unselected-legend");
	  svg_g.select(".svg-selector").selectAll("rect").style("fill-opacity", OPACITYOFF);
	  svg_g.select(".svg-selector").selectAll("text").text("");
	  cols = self.io.dataManager().getColumnRefiner();
	  for (i in data) {
	      index  = cols.indexOf(data[i].name);
	      if (index != -1) {
		  cols.splice(index, 1);
	      };	      
	  }
	  self.io.dataManager()._writeColumnRefiner(cols, {silent: false} );
      }
      function switchOnAllColumns(svg_g, data) {
	  var cols;
	  svg_g.select(".svg-selector").selectAll("rect").selectAll("g").attr("class", "selected-legend");
	  svg_g.select(".svg-selector").selectAll("rect").style("fill-opacity", OPACITYON);
	  svg_g.select(".svg-selector").selectAll("text").text("✓");
	  cols = self.io.dataManager().getColumnRefiner();
	  data.forEach(function (d) {
		  return cols.push(d.name);
	      });
	  self.io.dataManager().setColumnRefiner(cols);
      }
      function switchOffOneColumn(svg_g, rect) {
	  var key;
	  var cols;
	  var index;
	  var newName = self.getName4D3(d3.select(rect).attr("class"));
	  d3.select(rect).select("g").attr("class", "unselected-legend");
	  d3.select(rect).style("fill-opacity", OPACITYOFF);
	  svg_g.select(".svg-selector").select(".all").style("fill-opacity", OPACITYOFF);
	  svg_g.select(".svg-selector").select(".all").select('g').attr("class", "unselected-legend");
	  
	  svg_g.select(".svg-selector").selectAll(".checkAll").text("");
	  svg_g.select(".svg-selector").selectAll(".check" + newName).text("");			 
	  key = d3.select(rect).attr("class"); 
	  cols = self.io.dataManager().getColumnRefiner();
	  index  = cols.indexOf(key);
	  if (index != -1) {
	      cols.splice(index, 1);
	      self.io.dataManager().setColumnRefiner(cols);
	      if (cols.length == 0) {
		  /*現状のsetColumnRefinerの実装ではcolが空のとき、カラムがrefineされない(_writeColumnRefiner)
		    そのため、無理やりカラムをrefineする
		  */
		  self.io.dataManager()._writeColumnRefiner(cols, {silent: false} );
	      }
	  }
      }
      function switchOnOneColumn(svg_g, rect) {
	  var newName = self.getName4D3(d3.select(rect).attr("class"));
	  d3.select(rect).select("g").attr("class", "selected-legend");
	  d3.select(rect).style("fill-opacity", OPACITYON);

	  svg_g.select(".svg-selector").selectAll(".check" + newName).text("✓");
	  var key = d3.select(rect).attr("class"); 
	  var cols = self.io.dataManager().getColumnRefiner();
	  var index  = cols.indexOf(key);	 
	  if (index == -1) {
	      cols.push(key);
		  self.io.dataManager().setColumnRefiner(cols);
	  }
      }
      function drawRectForAllColumns(svg_g, data) {
	  var cols = self.io.dataManager().getColumnRefiner();
	  var flg = true;
	  var opacity;
	  var rect;
	  for (i = 0; i < data.length; i++) {
	      if (cols.indexOf(data[i].name) == -1) {
		  flg = false;
	      }
	  }
	  opacity = flg ? OPACITYON : OPACITYOFF;      
	  var text = flg ? "✓" : "";
	  rect = svg_g.select(".svg-selector")
	  .append("rect")
	  .attr("class", "all")
	  .attr("x", 20)
	  .attr("y", 30)
	  .attr("width",self.width / 4)
	  .attr("height",15)
	  .style("fill", "white")
	  .style("fill-opacity", opacity)
	  .on("click", function(d,i){
		  if (d3.select(this).select("g")[0][0] == null) {
		      d3.select(this).append('g').attr("class", "selected-legend");
		  }
		  var legendClass = d3.select(this).select("g").attr("class");
		  if (legendClass === "selected-legend") {
		      switchOffAllColumns(svg_g, data);
		  } else {
		      switchOnAllColumns(svg_g, data);
		  }
	      })
	  ;
	  svg_g.select(".svg-selector")
	  .append("text")
	  .attr("class", "checkAll")
	  .text(text)
	  .attr("x", 15 + self.width / 8)
	  .attr("y", 10 + 30 )
	  .attr("font-family", "sans-serif")
	  .attr("fill", "white")
	  .on("click", function(d,i){
		  if (rect.select("g")[0][0] == null) {
		      rect.append('g').attr("class", "selected-legend");
		  }
		  var legendClass = rect.select("g").attr("class");
		  if (legendClass === "selected-legend") {
		      switchOffAllColumns(svg_g, data);
		  } else {
		      switchOnAllColumns(svg_g, data);
		  }
	      })
;
      }
      function drawRects(svg_g, data) {
	  var colorManager = self.io.colorManager();
	  var i;
	  var cols;
	  var opacity;
	  var rect;
	  var text;
	  var name;
	  for (i = 0; i < data.length; i++) {	  
	      cols = self.io.dataManager().getColumnRefiner();
	      opacity = OPACITYOFF;
	      cols.forEach (function(col) {
		      if (col == data[i].name) {
			  opacity = OPACITYON;
		      }
		  });
	      rect = svg_g.select(".svg-selector")
		  .append("rect")
		  .attr("class", data[i].name)
		  .attr("x", 20)
		  .attr("y",(i + 2) * 30)
		  .attr("width",self.width / 4)
		  .attr("height",15)
		  .style("fill", function (d) {
			  return colorManager.getColorOfColumn(data[i].name);
		      })
		  .style("fill-opacity", opacity)
		  .on("click",      function(d,i){
			  if (d3.select(this).select("g")[0][0] == null) {
			      d3.select(this).append('g').attr("class", "unselected-legend");
			  }
			  var legendClass = d3.select(this).select("g").attr("class");
			  if (legendClass === "selected-legend") {
			      switchOffOneColumn(svg_g, this);
			  } else {
			      switchOnOneColumn(svg_g, this);
			  }
		      });
	      rect.append('g').attr("class", "unselected-legend");
	  }

	  for (i = 0; i < data.length; i++) {
	      cols = self.io.dataManager().getColumnRefiner();
	      text = "";
	      cols.forEach (function(col) {
		      if (col == data[i].name) {
			  text = "✓";
		      }
		  });
	      var newName = self.getName4D3(data[i].name);
	      svg_g.select(".svg-selector")
	      .append("text")	      

	      .attr("class", "check" + newName)
	      .text(text)
	      .attr("x", 15 + self.width / 8)
	      .attr("y", 10 + 30 * (i+2))
	      .attr("font-family", "sans-serif")
	      .attr("fill", "white")
	      .on("click",      function(d,i){
		      name = "rect." + data[i].name;
		      });
	  }
      }
  };

  /**
   * write text for selectors
   * @method writeTextForSelectors
   * @memberOf Legend
   */
  Legend.prototype.writeTextForSelectors = function (svg_g, data) {
      var self = this;
      var colorManager = self.io.colorManager();
      var i;
      svg_g.select(".svg-selector-cols").append('g')
      .append("text")
      .attr("x",20)
      .attr("y",12 + 30)
      .text("All");
      for (i = 0; i < data.length; i++) {	  
	  svg_g.select(".svg-selector-cols").append('g')
	      .append("text")
	      .attr("x",20)
	      .attr("y",12 + (i + 2) * 30)
	      .text(data[i].name)
	      .style("stroke", function (d) {
		      return colorManager.getColorOfColumn(data[i].name);
	       });
      }
      return;
  };

  /**
   * write text for exclusive selectors
   * @method writeTextForExclusiveSelectors
   * @memberOf Legend
   */
  Legend.prototype.writeTextForExclusiveSelectors = function (svg_g, data) {
      var self = this;
      var colorManager = self.io.colorManager();
      var i = 0, j = 0, sum = 0;
      var keys = Object.keys(data);
      for (i = 0; i < keys.length; i++) {
	  for (j = 0; j < data[keys[i]].length; j++) {	        
	      sum++;
	      svg_g.select(".svg-exclusiveSelector-cols").append('g')
	      .append("text")
	      .attr("x",20)
	      .attr("y",sum * 30)
	      .text(data[keys[i]][j].name)
	      .style("stroke", function (d) {
		      return colorManager.getColorOfColumn(data[keys[i]][j].name);
		  });	      
	  }
      }
  };

  /**
   * set div
   * @method setDiv
   * @memberOf Legend
   */
  
  Legend.prototype.setRegionForOption = function (svg_g) {
       var self = this;

       svg_g.append("div")
           .attr("class","div-options")
           .style("width", function(){
               return self.containerWidth  +"px";

           })
	   .style("height",   function(){
		   return (self.containerHeight / 10) + "px";
	   })
           .style("overflow-y","auto");
       svg_g.select(".div-options").append("svg")
           .attr("class", "svg-options")
           .style("width", function(){
               return self.containerWidth  +"px";
           })
	   .style("height",   function(){
		   return (self.containerHeight / 10 - 10) + "px";
	   })
               .style("overflow-x","auto")
      ;
  };
  Legend.prototype.setRegionForSelectors = function (svg_g) {
       var self = this;
       svg_g.append("div")
           .attr("class","div-selector")
           .style("width", function(){
               return self.width / 2  +"px";

           })
	   .style("height",   function(){
		   return (self.selectorHeight) + "px";
	   })
           .style("overflow-y","auto");
       svg_g.select(".div-selector").append("svg")
           .attr("class", "svg-selector")
           .style("width", function(){
               return self.width / 2  +"px";
           })
	   .style("height",   function(){
		   return (self.selectorHeight - 10) + "px";
	   })
               .style("overflow-x","auto")
      ;
  };
  Legend.prototype.setRegionForTextOfSelectors = function (svg_g) {
      var self = this;
       svg_g.append("div")
           .attr("class","div-selector-cols")
           .style("width", function(){
		   return self.width / 2  +"px";
           })
	   .style("height",   function(){
		   return (self.selectorHeight) + "px";
	   })
           .style("overflow-x","auto");
       svg_g.select(".div-selector-cols").append("svg")
           .attr("class", "svg-selector-cols")
           .style("width", function(){
		   return self.width / 2  +"px";
           })
	   .style("height",   function(){
		   return (self.selectorHeight - 10) + "px";
	   })
           .style("overflow-x","auto")
      ;
  };
  Legend.prototype.setRegionForExclusiveSelectors = function (svg_g) {
       var self = this;
       svg_g.append("div")
           .attr("class","div-exclusiveSelector")
           .style("width", function(){
               return self.width / 2  +"px";
           })
	   .style("height",   function(){
		   return (self.exclusiveSelectorHeight) + "px";
	   })
           .style("overflow-y","auto");
       svg_g.select(".div-exclusiveSelector").append("svg")
           .attr("class", "svg-exclusiveSelector")
           .style("width", function(){
               return self.width / 2  +"px";
           })
	   .style("height",   function(){
		   return (self.exclusiveSelectorHeight - 10) + "px";
	   })
       .style("overflow-x","auto");       
  };
  Legend.prototype.setRegionForGroupSelectors = function (svg_g) {
       var self = this;
       svg_g.append("div")
           .attr("class","div-groupSelector")
           .style("width", function(){
               return self.width   +"px";
           })
	   .style("height",   function(){
		   return (self.groupSelectorHeight) + "px";
	   })
           .style("overflow-y","auto");
       svg_g.select(".div-groupSelector").append("svg")
           .attr("class", "svg-groupSelector")
           .style("width", function(){
               return self.width   +"px";
           })
	   .style("height",   function(){
		   return (self.groupSelectorHeight - 10) + "px";
	   })
       .style("overflow-x","auto");
  };
 
  Legend.prototype.setRegion = function(svg_g, name, width, height) {
      var self = this;
       svg_g.append("div")
           .attr("class","div-" + name)
           .style("width", function(){
               return width   +"px";
           })
	   .style("height",   function(){
		   return height + "px";
	   })
           .style("overflow-y","auto");
       svg_g.select(".div-" + name).append("svg")
           .attr("class", "svg-" + name)
           .style("width", function(){
               return width   +"px";
           })
	   .style("height", function(){
		   return (height - 10) + "px";
	   })
       .style("overflow-x","auto");
  };

  Legend.prototype.setRegionForTextOfExclusiveSelectors = function (svg_g) {
       var self = this;
       svg_g.append("div")
           .attr("class","div-exclusiveSelector-cols")
           .style("width", function(){
		   return self.width / 2 +"px";
           })
	   .style("height",   function(){
		   return (self.exclusiveSelectorHeight) + "px";
	   })
           .style("overflow-x","auto");
       svg_g.select(".div-exclusiveSelector-cols").append("svg")
           .attr("class", "svg-exclusiveSelector-cols")
           .style("width", function(){
		   return self.width / 2  +"px";
           })
	   .style("height",   function(){
		   return (self.exclusiveSelectorHeight - 10) + "px";
	   })
           .style("overflow-x","auto")
      ;
  };

  Legend.prototype.drawOptions = function(svg_g) {
       var self = this;
       var svg_g_g = svg_g.select(".svg-options").append("g");
       var showOrHide;
       svg_g_g.append("rect")
       .attr("class", "optionSelectors")
       .attr("x", 20)
       .attr("y",  self.containerHeight/100)
       .attr("width", self.containerWidth/4)
       .attr("height", self.containerHeight / 20)
       .style("fill", "white")
       .on("click" , function (){
	       changeShowOrHide(textSelector);
	   });
       svg_g_g.append("text")
       .attr("x", 20)
       .attr("y", self.containerHeight/40 + self.containerHeight/100)
       .text(function () {
	       return writeShowOrhide(textSelector);
	   })
       .on("click" , function (){
	       changeShowOrHide(textSelector);
	   })
       .attr("font-family", "sans-serif")
       .attr("font-size", "10px")
       .attr("font-weight", "bold")
       .style("fill", "red")
       ;       
       svg_g_g = svg_g.select(".svg-options").append("g");
       svg_g_g.append("rect")
       .attr("class", "optionExclusiveSelectors")
       .attr("x", self.containerWidth/3)
       .attr("y", self.containerHeight/100)
       .attr("width", self.containerWidth/4)
       .attr("height", self.containerHeight / 20)
       .style("fill", "white")
       .on("click" , function (){
	       changeShowOrHide(textExclusiveSelector);
	   });
       svg_g_g.append("text")
       .attr("x",  self.containerWidth/3)
       .attr("y", self.containerHeight/40 + self.containerHeight/100)
       .text(function () {
	       return writeShowOrhide(textExclusiveSelector);
	   })
       .on("click" , function (){
	       changeShowOrHide(textExclusiveSelector);
	   })
       .attr("font-family", "sans-serif")
       .attr("font-size", "10px")
       .attr("font-weight", "bold")
       .style("fill", "red");

       svg_g_g = svg_g.select(".svg-options").append("g");
       svg_g_g.append("rect")
       .attr("class", "optionGroupSelectors")
       .attr("x", self.containerWidth*2/3-20)
       .attr("y", self.containerHeight/100)
       .attr("width", self.containerWidth/4)
       .attr("height", self.containerHeight / 20)
       .style("fill", "white")
       .on("click" , function (){
	       changeShowOrHide(textGroupSelector);
	   });
       svg_g_g.append("text")
       .attr("x",   self.containerWidth*2/3-20)
       .attr("y", self.containerHeight/40 + self.containerHeight/100)
       .text(function () {
	       return writeShowOrhide(textGroupSelector);
	   })
       .on("click" , function (){
	       changeShowOrHide(textGroupSelector);
	   })
       .attr("font-family", "sans-serif")
       .attr("font-size", "10px")
       .attr("font-weight", "bold")
       .style("fill", "red");

       function writeShowOrhide(option) {
	   showOrHide = self.io.designManager().getValue(option);
	   if (showOrHide == "show") {
	       return "Hide " + option;
	   } else {
	       return "Show " + option;
	   } 
       }
       function changeShowOrHide(option) {
	   showOrHide = self.io.designManager().getValue(option);
	   if (showOrHide == "show") {
	       self.io.designManager().setValue(option, "hide");
	   } else {
	       self.io.designManager().setValue(option, "show");
	   } 	       
       }
   };

  /**
   * draw Legend (Selectors, Exclusive Selectors, Group Selectors)
   * @method drawLegend
   * @memberOf Legend
   */	    
   Legend.prototype.drawLegend = function(data) {
       var self = this;
       var svg_g = self.svg_g;       
       var singleData = data[0];
       var exclusiveData = data[1];
       var groupData = data[2];
       var designManager = self.io.designManager();
       var gCol = self.autoMap(groupData);
       if (designManager.getValue("ShowSelectorsBox") == "show") {
	   self.setRegionForOption(svg_g);
	   self.drawOptions(svg_g);
       }
       if (designManager.getValue(textSelector) == "show") {
	   /*draw selectors from singleData*/
	   self.setRegion(svg_g, "selector", self.width / 2, self.height);	   
	   self.drawSelectors(svg_g, singleData);
	   /*write text for selectors*/
	   self.setRegion(svg_g, "selector-cols", self.width / 2, self.height);
	   self.writeTextForSelectors(svg_g, singleData);
       }
       if (designManager.getValue(textExclusiveSelector) == "show") {
	   /*draw exclusive selectors*/
	   self.setRegion(svg_g, "exclusiveSelector", self.width / 2, self.height);	   
	   self.setRegion(svg_g, "exclusiveSelector-cols", self.width / 2, self.height);
	   self.drawExclusiveSelectors(svg_g, exclusiveData);
	   /*write text for exclusive selectors*/
	   self.setRegionForTextOfExclusiveSelectors(svg_g);
	   self.writeTextForExclusiveSelectors(svg_g, exclusiveData);
       }
       if (designManager.getValue(textGroupSelector) == "show") {        
	   /*draw group selectors*/
	   self.setRegion(svg_g, "groupSelector", self.width / 2, self.height);
	   self.setRegion(svg_g, "groupSelector-cols", self.width / 2, self.height);
	   self.drawGroupSelectors(svg_g, groupData);
       }
  };

  /**
   * resize
   * @method resize
   * @memberOf Legend
   */	    
 Legend.prototype.resize =  function (containerWidth, containerHeight) {
    // update size

    var self = this;
    self.containerWidth  = containerWidth;
    self.containerHeight = containerHeight;

    self.width = self.containerWidth / 2 - 10;
    self.height = self.containerHeight ;
    self.selectorHeight = self.height;
    self.exclusiveSelectorHeight = self.height;
    self.groupSelectorHeight = self.height;
    var data = self.transformData();
    self.redraw();
  };

  Legend.prototype.getName4D3 = function(name)
  {
    var space,
        lp,
        rp,
        slash,
        and,
        newName = name.concat();
    space = searchIndexs(name, " ");
    lp = searchIndexs(name, "(");
    rp = searchIndexs(name, ")");
    slash = searchIndexs(name, "/");
    and = searchIndexs(name, "&");
    newName = generateNewWord(newName, space, " ", "space");
    newName = generateNewWord(newName, lp, "(", "LeftParenthesis");
    newName = generateNewWord(newName, rp, ")", "RightParenthesis");
    newName = generateNewWord(newName, slash, "/", "slash");
    newName = generateNewWord(newName, and, "&", "and");
    newName = replaceHeadNum(newName);
    return newName;
    /**
     * Replace head num 
     * @param word
     */
    function replaceHeadNum(word) {
      var num = word.match(/^\d/);
      if (num != null) {
	return word.replace(/^\d/, "_" + num);
      }
	return word;
    }
    /**
    * Search target indexs
    * @param  word
    * @param  key
    * @return {array index}
    */
    function searchIndexs(word, key) {
      var aindex = [];
      var pos = word.indexOf(key);
      while (pos != -1) {
        aindex.push(pos);
        pos = word.indexOf(key, pos + 1);	
      }
      return aindex;
    }
    /**
    * Convert word
    * @param  word
    * @param  index
    * @param  before key
    * @param  after key
    * @return converted word
    */
    function generateNewWord(word, index, before, after) {
      var pos = word.indexOf(before);
      var ele;
      while (pos != -1) {
	ele = index.shift();
        if (ele == undefined) {
          console.error("Illegal index");
        }
        word = word.replace(before, after + String(ele));
        pos = word.indexOf(before, pos + 1);	
      }
      return word;
    }
  };

  Legend.prototype.autoMap = function(groupData) {
    var gCol = {};
    getAllColumnInGroup(groupData, gCol);
    function getAllColumnInGroup(group, gCol) {
      Object.keys(group).forEach(function(key) {
        group[key].forEach(function(d) {
          if (d.kind == "data") {
            gCol[d.data.name] = 0;
	  } else if (d.kind == "group") {
	    getAllColumnInGroup(d.data, gCol);
	  }
	});
      });
    }
    return gCol;
  };

  return Legend;
});
