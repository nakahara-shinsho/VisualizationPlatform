//https://blog.serverdensity.com/using-gridster-to-build-custom-dashboards/
define(['d3', 'css!./common'], function(d3) {
    'use strict';
    /**
     * define GraphCreator object
     * @class GraphCreator
     * @param {type} svg
     * @param {type} nodes
     * @param {type} edges
     * @returns {_L2.GraphCreator}
     */
  
    var GraphCreator = function(container, nodes, edges) {
        var thisGraph = this,
            svgG = null;
        
        var svg = d3.select(container[0]).append('svg')
          .attr("width", container.width())
          .attr("height", container.height());
        
        thisGraph.idct = 0;

        // Initial array of nodes
        thisGraph.nodes = nodes || [];

        // Initial array of edges
        thisGraph.edges = edges || [];

        // Initial first state
        thisGraph.state = {
            selectedNode: null,
            selectedEdge: null,
            mouseDownNode: null,
            mouseDownLink: null,
            justDragged: false,
            justScaleTransGraph: false,
            lastKeyDown: -1,
            shiftNodeDrag: false,
            selectedText: null
        };

        // define arrow markers for graph links
        var defs = svg.append('svg:defs');
        defs.append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', "8")
            .attr('markerWidth', 3.5)
            .attr('markerHeight', 3.5)
            .attr('orient', 'auto')
            //.attr('fill', 'red') //add by lxx in 2015/12/18
          .append('svg:path')
            .classed('marker', true)
            //.attr('fill', 'red')
            .attr('d', 'M0,-5L10,0L0,5');

        // define arrow markers for leading arrow
        defs.append('svg:marker')
            .attr('id', 'mark-end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 7)
            .attr('markerWidth', 3.5)
            .attr('markerHeight', 3.5)
            .attr('orient', 'auto')
          .append('svg:path')
            //.attr('fill', 'red')
            .classed('marker', true)
            .attr('d', 'M0,-5L10,0L0,5');

        thisGraph.svg = svg;
        thisGraph.svgG = svg.append("g")
            .classed(thisGraph.consts.graphClass, true);
        svgG = thisGraph.svgG;

        // displayed when dragging between nodes
        thisGraph.dragLine = svgG.append('svg:path')
            .attr('class', 'link dragline hidden')
            .attr('d', 'M0,0L0,0')
            .style('marker-end', 'url(#mark-end-arrow)');
            
        // svg nodes and edges 
        thisGraph.paths = svgG.append("g").selectAll("g");
        thisGraph.rects = svgG.append("g").selectAll("g");

        thisGraph.drag = d3.behavior.drag()
            .origin(function(d) {
                return {x: d.x, y: d.y};
            })
            .on("drag", function(args) {
                thisGraph.state.justDragged = true;
                thisGraph.dragmove.call(thisGraph, args);
            })
            .on("dragend", function() {
                // todo check if edge-mode is selected
            });

        // listen for key events
        d3.select(window)
          .on("keydown", function() {
            thisGraph.svgKeyDown.call(thisGraph);
          })
          .on("keyup", function() {
                thisGraph.svgKeyUp.call(thisGraph);
            });
    
        svg.on("mousedown", function(d) {
            thisGraph.svgMouseDown.call(thisGraph, d);
        });
        svg.on("mouseup", function(d) {
            thisGraph.svgMouseUp.call(thisGraph, d);
        });

        // listen for dragging
        var dragSvg = d3.behavior.zoom()
            .on("zoom", function() {
                if (d3.event.sourceEvent.shiftKey) {
                    return false;
                } else {
                    thisGraph.zoomed.call(thisGraph);
                }
                return true;
            })
            .on("zoomstart", function() {
                var ael = d3.select("#" + thisGraph.consts.activeEditId).node();
                if (ael) {
                    ael.blur();
                }
                if (!d3.event.sourceEvent.shiftKey)
                    d3.select('body').style("cursor", "move");
            })
            .on("zoomend", function() {
                d3.select('body').style("cursor", "auto");
            });

        svg.call(dragSvg).on("dblclick.zoom", null);
/*
        // listen for resize
        window.onresize = function() {
            thisGraph.updateWindow(svg);
        };
*/
      
      
        // handle download data. For storing data to file or client to re-load chart
        // This blog code might be using in this phase, can using in future
        d3.select("#download-input").on("click", function() {
            var saveEdges = [];
            thisGraph.edges.forEach(function(val) {
                saveEdges.push({source: val.source.id, target: val.target.id});
            });
            var blob = new Blob([window.JSON.stringify({"nodes": thisGraph.nodes, "edges": saveEdges})], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "mydag.json");
        });

        // handle uploaded data. For loading data from file or client to re-load chart.
        // This blog code might be using in this phase, can using in future
        d3.select("#upload-input").on("click", function() {
            document.getElementById("hidden-file-upload").click();
        });
        
      
        d3.select("#hidden-file-upload").on("change", function() {
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                var uploadFile = this.files[0];
                var filereader = new window.FileReader();

                filereader.onload = function() {
                    var txtRes = filereader.result;
                    try {
                        var jsonObj = JSON.parse(txtRes);
                        thisGraph.deleteGraph(true);
                        thisGraph.nodes = jsonObj.nodes;
                        thisGraph.setIdCt(jsonObj.nodes.length + 1);
                        var newEdges = jsonObj.edges;
                        newEdges.forEach(function(e, i) {
                            newEdges[i] = {source: thisGraph.nodes.filter(function(n) {
                                    return n.id === e.source;
                                })[0],
                                target: thisGraph.nodes.filter(function(n) {
                                    return n.id === e.target;
                                })[0]};
                        });
                        thisGraph.edges = newEdges;
                        thisGraph.updateGraph();
                    } catch (err) {
                        window.alert("Error parsing uploaded file\nerror message: " + err.message);
                        return;
                    }
                };
                filereader.readAsText(uploadFile);
            } else {
                alert("Your browser won't let you save this graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
            }
        });

        // handle delete graph.
        d3.select("#delete-graph").on("click", function() {
            thisGraph.deleteGraph(false);
        });
    };

    /**
     * Setter function for setup data of IdCt
     * @param {type} idct
     */
    GraphCreator.prototype.setIdCt = function(idct) {
        this.idct = idct;
    };

    /**
     * Constants using in this class
     */
    GraphCreator.prototype.consts = {
        selectedClass: "selected",
        connectClass: "connect-node",
        rectGClass: "conceptG",
        graphClass: "graph",
        activeEditId: "active-editing",
        BACKSPACE_KEY: 8,
        DELETE_KEY: 46,
        ENTER_KEY: 13,
        nodeWidth: 150,
        nodeHeight: 50
    };

    GraphCreator.prototype.pathEnd = {
        target_centerX: 0,
        target_centerY: 0,
        source_centerX: 0,
        source_centerY: 0,
        target_newX: 0,
        target_newY: 0,
        source_newX: 0,
        source_newY: 0
    };

    /**
     * Functiong for handling event drag and move node
     * @param {type} d data of node
     */
    GraphCreator.prototype.dragmove = function(d) {
        var thisGraph = this,
            consts= thisGraph.consts;
        if (thisGraph.state.shiftNodeDrag) {
            var d_x = d.x + consts.nodeWidth/2,
                d_y = d.y + consts.nodeHeight/2;
            thisGraph.dragLine.attr('d', 'M' + d_x + ',' + d_y + 'L' + d3.mouse(thisGraph.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
        } else {
            // Update x & y of data d
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            // Update graph after change data
            thisGraph.updateGraph();
        }
    };

    /**
     * Function for delete all graph in editor area
     * @param {type} skipPrompt
     */
    GraphCreator.prototype.deleteGraph = function(skipPrompt) {
        var thisGraph = this,
            doDelete = true;
        if (!skipPrompt) {
            doDelete = window.confirm("Press OK to delete this graph");
        }
        if (doDelete) {
            thisGraph.nodes = [];
            thisGraph.edges = [];
            thisGraph.updateGraph();
        }
    };

    /**
     * Select text from editable object for easy editing
     * select all text in element: taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element 
     * @param {type} el
     */
    GraphCreator.prototype.selectElementContents = function(el) {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    };

    /**
     * Function handle event when user edit label of path in graph
     * @param {type} d3path
     * @param {type} d
     */
    GraphCreator.prototype.insertLabelPathLinebreaks = function(d3path, d) {
        var linkData = d;
        var label = d.label;
        var g = d3.select(d3path[0][0].parentNode);

        g.append("text")
            .attr("class", "path-direct")
            .attr("dy", -5)
            .attr("id", function(d) {
                return "lableId_" + linkData.source.id + "_" + linkData.target.id;
            })
            .attr('fill', '#f00')
            .append("textPath")
            .attr("xlink:href", function(d) {
                return "#linkId_" + linkData.source.id + "_" + linkData.target.id;
            })
            .style("text-anchor","middle ") 
            .attr("startOffset","50%")
            .append("tspan")
            .attr("class", "path-label")
            .text(function(d) {
                return label;
            });
    };

    /**
     * Function for hande event when user edit title of note.
     * But in this graph. We disable this function. Might be using in future
     * insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts
     * @param {type} gEl
     * @param {type} title
     */
    GraphCreator.prototype.insertTitleLinebreaks = function(gEl, title) {

        var words = title.split(/\s+/g),
            nwords = words.length;
        var el = gEl.append("text")
            .attr("y", "30")
            .attr("x", "30");

        for (var i = 0; i < words.length; i++) {
            var tspan = el.append('tspan').text(words[i]);
            if (i > 0)
                tspan.attr('x', '30').attr('dy', '25');
        }
    };

    /**
     * remove edges associated with a node
     * @param {type} node
     */
    GraphCreator.prototype.spliceLinksForNode = function(node) {
        var thisGraph = this,
            toSplice = thisGraph.edges.filter(function(l) {
                return (l.source === node || l.target === node);
            });
        toSplice.map(function(l) {
            thisGraph.edges.splice(thisGraph.edges.indexOf(l), 1);
        });
    };

    /**
     * User can select edge for hightlight path
     * @param {type} d3Path
     * @param {type} edgeData
     */
    GraphCreator.prototype.replaceSelectEdge = function(d3Path, edgeData) {
        var thisGraph = this;
        d3Path.classed(thisGraph.consts.selectedClass, true);
        if (thisGraph.state.selectedEdge) {
            thisGraph.removeSelectFromEdge();
        }
        thisGraph.state.selectedEdge = edgeData;
    };

    /**
     * User can select node for hightlight node
     * @param {type} d3Node
     * @param {type} nodeData
     */
    GraphCreator.prototype.replaceSelectNode = function(d3Node, nodeData) {
        var thisGraph = this;
        d3Node.classed(this.consts.selectedClass, true);
        if (thisGraph.state.selectedNode) {
            thisGraph.removeSelectFromNode();
        }
        thisGraph.state.selectedNode = nodeData;
    };

    /**
     * Remove selected node. Reset all node to normal state
     */
    GraphCreator.prototype.removeSelectFromNode = function() {
        var thisGraph = this;
        thisGraph.rects.filter(function(cd) {
            return cd.id === thisGraph.state.selectedNode.id;
        }).classed(thisGraph.consts.selectedClass, false);
        thisGraph.state.selectedNode = null;
    };

    /**
     * Remove selected edge. Reset all edge to normal state
     */
    GraphCreator.prototype.removeSelectFromEdge = function() {
        var thisGraph = this;
        thisGraph.paths.filter(function(cd) {
            return cd === thisGraph.state.selectedEdge;
        }).classed(thisGraph.consts.selectedClass, false);
        thisGraph.state.selectedEdge = null;
    };

    /**
     * Edit path when click or shift+click
     * Click on path to add or edit label
     * Shift + Click to select or deselect path
     * @param {type} d3path
     * @param {type} d
     */
    GraphCreator.prototype.pathMouseDown = function(d3path, d) {
        var thisGraph = this,
            state = thisGraph.state;
        d3.event.stopPropagation();

        // Handle event when hold Shift key + Click
        if (d3.event.shiftKey) {
            if (state.selectedNode) {
                thisGraph.removeSelectFromNode();
            }
            var prevEdge = state.selectedEdge;
            if (!prevEdge || prevEdge !== d) {
                thisGraph.replaceSelectEdge(d3path, d);
            } else {
                thisGraph.removeSelectFromEdge();
            }
            // Handle event when Click
        } else {
            state.mouseDownLink = d;
        }
    };

    /**
     * Handle event when user click up on a path to edit path
     * @param {type} d3path
     * @param {type} d
     */
    GraphCreator.prototype.pathMouseUp = function(d3path, d) {
        var thisGraph = this,
            state = thisGraph.state;
        var mouseDownLink = state.mouseDownLink;

        if (!mouseDownLink)
            return;

        var linkData = d;

        // Change text here
        // Remove all text in a path
        d3.select(d3path[0][0].parentNode).select("text#lableId_" + linkData.source.id + "_" + linkData.target.id).remove();
        var editLable = thisGraph.changeTextOfPath(d3path, d);
        var txtLink = editLable.node();
        thisGraph.selectElementContents(txtLink);
        txtLink.focus();
    };

    /**
     * Handle event wwhen usser mousedown on node
     * @param {type} d3node
     * @param {type} d
     */
    GraphCreator.prototype.rectMouseDown = function(d3node, d) {
        var thisGraph = this,
            state = thisGraph.state;
        d3.event.stopPropagation();
        state.mouseDownNode = d;
        if (d3.event.shiftKey) {
            state.shiftNodeDrag = d3.event.shiftKey;
            // reposition dragged directed edge
            thisGraph.dragLine.classed('hidden', false)
                .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
            return;
        }
    };

    /**
     * Place editable text on path in place of svg text
     * @param {type} d3path
     * @param {type} d
     */
    GraphCreator.prototype.changeTextOfPath = function(d3path, d) {
        var thisGraph = this,
            consts = thisGraph.consts;

        console.log(d3path, d);
        var dx = (d.source.x - d.target.x) / 2 + d.target.x;
        var dy = (d.source.y - d.target.y) / 2 + d.target.y;
        var label = "edit text here";
        if (d.label && d.label !== "") {
            label = d.label;
        }
        ;
        var editableObject = thisGraph.svg.selectAll("foreignObject")
            .data([d])
            .enter()
            .append("foreignObject")
            .attr("x", dx)
            .attr("y", dy)
            .attr("height", 100)
            .attr("width", 200)
            .append("xhtml:p")
            .attr("id", consts.activeEditId)
            .attr("contentEditable", "true")
            .text(label)
            .on("mousedown", function(d) {
                d3.event.stopPropagation();
            })
            .on("keydown", function(d) {
                d3.event.stopPropagation();
                if (d3.event.keyCode == consts.ENTER_KEY && !d3.event.shiftKey) {
                    this.blur();
                }
            })
            .on("blur", function(d) {
                d.label = this.textContent;
                thisGraph.insertLabelPathLinebreaks(d3path, d);
                d3.select(this.parentElement).remove();
            });

        return editableObject;
    };

    /**
     * Place editable text on node in place of svg text
     * Not using in this graph. Might be using in future
     * @param {type} d3node
     * @param {type} d
     */
    GraphCreator.prototype.changeTextOfNode = function(d3node, d) {
        var thisGraph = this,
            consts = thisGraph.consts,
            htmlEl = d3node.node();
        d3node.selectAll("text").remove();
        var nodeBCR = htmlEl.getBoundingClientRect(),
            curScale = nodeBCR.width / consts.nodeHeight,
            placePad = 5 * curScale,
            useHW = curScale > 1 ? nodeBCR.width * 0.71 : consts.nodeHeight * 1.42;
        // replace with editableconent text
        var d3txt = thisGraph.svg.selectAll("foreignObject")
            .data([d])
            .enter()
            .append("foreignObject")
            .attr("x", nodeBCR.left + placePad)
            .attr("y", nodeBCR.top + placePad)
            .attr("height", 2 * useHW)
            .attr("width", useHW)
            .append("xhtml:p")
            .attr("id", consts.activeEditId)
            .attr("contentEditable", "true")
            .text(d.title)
            .on("mousedown", function(d) {
                d3.event.stopPropagation();
            })
            .on("keydown", function(d) {
                d3.event.stopPropagation();
                if (d3.event.keyCode == consts.ENTER_KEY && !d3.event.shiftKey) {
                    this.blur();
                }
            })
            .on("blur", function(d) {
                d.title = this.textContent;
                thisGraph.insertTitleLinebreaks(d3node, d.title);
                d3.select(this.parentElement).remove();
            });
        return d3txt;
    };

    /**
     * Handle event when mouseup on nodes
     * @param {type} d3node
     * @param {type} d
     */
    GraphCreator.prototype.rectMouseUp = function(d3node, d) {
        var thisGraph = this,
            state = thisGraph.state,
            consts = thisGraph.consts;
        // reset the states
        state.shiftNodeDrag = false;
        d3node.classed(consts.connectClass, false);

        var mouseDownNode = state.mouseDownNode;

        if (!mouseDownNode)
            return;

        thisGraph.dragLine.classed("hidden", true);

        // Check state mouseDownNode for know create path
        if (mouseDownNode !== d) {
            // we're in a different node: create new edge for mousedown edge and add to graph
            var newEdge = {source: mouseDownNode, target: d, label: ""};
            var filtRes = thisGraph.paths.filter(function(d) {
                if (d.source === newEdge.target && d.target === newEdge.source) {
                    thisGraph.edges.splice(thisGraph.edges.indexOf(d), 1);
                }
                return d.source === newEdge.source && d.target === newEdge.target;
            });
            if (!filtRes[0].length) {
                thisGraph.edges.push(newEdge);
                thisGraph.updateGraph();
            }
        } else {
            // we're in the same node
            if (state.justDragged) {
                // dragged, not clicked
                state.justDragged = false;
            } else {
                // clicked, not dragged. For mark selected node
                if (state.selectedEdge) {
                    thisGraph.removeSelectFromEdge();
                }
                var prevNode = state.selectedNode;

                if (!prevNode || prevNode.id !== d.id) {
                    thisGraph.replaceSelectNode(d3node, d);
                } else {
                    thisGraph.removeSelectFromNode();
                }
            }
        }
        state.mouseDownNode = null;
        return;
    }; // end of rects mouseup

    /**
     * Handle event when mousedown on main svg
     */
    GraphCreator.prototype.svgMouseDown = function() {
        this.state.graphMouseDown = true;
    };

    /**
     * Handle event when mouseup on main svg
     */
    GraphCreator.prototype.svgMouseUp = function() {
        var thisGraph = this,
            state = thisGraph.state;
        if (state.justScaleTransGraph) {
            // dragged not clicked
            state.justScaleTransGraph = false;
        } else if (state.shiftNodeDrag) {
            // dragged from node
            state.shiftNodeDrag = false;
            thisGraph.dragLine.classed("hidden", true);
        }
        state.graphMouseDown = false;
    };

    /**
     * Handle event when keydown on main svg
     */
    GraphCreator.prototype.svgKeyDown = function() {
        var thisGraph = this,
            state = thisGraph.state,
            consts = thisGraph.consts;
        // make sure repeated key presses don't register for each keydown
        if (state.lastKeyDown !== -1)
            return;

        state.lastKeyDown = d3.event.keyCode;
        var selectedNode = state.selectedNode,
            selectedEdge = state.selectedEdge;

        switch (d3.event.keyCode) {
            case consts.BACKSPACE_KEY:
            case consts.DELETE_KEY:
                d3.event.preventDefault();
                if (selectedNode) {
                    thisGraph.nodes.splice(thisGraph.nodes.indexOf(selectedNode), 1);
                    thisGraph.spliceLinksForNode(selectedNode);
                    state.selectedNode = null;
                    thisGraph.updateGraph();
                } else if (selectedEdge) {
                    thisGraph.edges.splice(thisGraph.edges.indexOf(selectedEdge), 1);
                    state.selectedEdge = null;
                    thisGraph.updateGraph();
                }
                break;
        }
    };

    /**
     * Handle event when keyup on main svg
     * @returns {undefined}
     */
    GraphCreator.prototype.svgKeyUp = function() {
        this.state.lastKeyDown = -1;
    };

    GraphCreator.prototype.moveto = function(d) {
        var thisGraph = this,
            consts = thisGraph.consts,
            pathEnd = thisGraph.pathEnd;
        var w = consts.nodeWidth;
        var h = consts.nodeHeight;
        // ...so we can change the x,y coordinates of the node to be
        // at its center rather than the top-left corner
        pathEnd.source_newX = d.source.x + (w / 2);
        pathEnd.source_newY = d.source.y + (h / 2);
        return "M" + pathEnd.source_newX + "," + pathEnd.source_newY;
    };

    GraphCreator.prototype.lineto = function(d) {
        var thisGraph = this,
            consts = thisGraph.consts,
            pathEnd = thisGraph.pathEnd;
        var w = consts.nodeWidth;
        var h = consts.nodeHeight;
        pathEnd.target_centerX = d.target.x + (w / 2);
        pathEnd.target_centerY = d.target.y + (h / 2);

        var smartpathEnd = thisGraph.smartPathEnd(d, w, h);
        return " L" + smartpathEnd.target_newX + "," + smartpathEnd.target_newY;
    };

    GraphCreator.prototype.smartPathEnd = function(d, w, h) {
        var thisGraph = this,
            consts = thisGraph.consts,
            pathEnd = thisGraph.pathEnd;

        pathEnd.source_centerX = d.source.x + w / 2;
        pathEnd.source_centerY = d.source.y + h / 2;
        pathEnd.target_newX = d.target.x + (w / 2);
        pathEnd.target_newY = d.target.y + (h / 2);

        var tanRatioFixed = (pathEnd.target_centerY - d.target.y) / (pathEnd.target_centerX - d.target.x);
        var tanRatioMoveable = Math.abs(pathEnd.target_centerY - pathEnd.source_newX) / Math.abs(pathEnd.target_centerX - pathEnd.source_newX);
//        console.log("tanRatioFixed,tanRatioMoveable:", tanRatioFixed, tanRatioMoveable);
        if (tanRatioMoveable === tanRatioFixed) {
            pathEnd.target_newX = d.target.x;
            if (pathEnd.target_centerX < pathEnd.source_newX) {
                // if target node is to left of the source node
                pathEnd.target_newX = d.target.x + w;
            }

            // By default assume path intersects a top corner
            pathEnd.target_newY = d.target.y;
            if (pathEnd.target_centerY < pathEnd.source_newY) {
                // if target node is above the source node
                pathEnd.target_newY = d.target.y + h;
            }
        }

        if (tanRatioMoveable < tanRatioFixed) {
            // By default assume path intersects left vertical side
            pathEnd.target_newX = d.target.x;
            if (pathEnd.target_centerX < pathEnd.source_newX) {
                // if target node is to left of the source node
                pathEnd.target_newX = d.target.x + w;
            }
            // By default assume path intersects towards top of node								
            pathEnd.target_newY = pathEnd.target_centerY - ((pathEnd.target_centerX - d.target.x) * tanRatioMoveable);
            if (pathEnd.target_centerY < pathEnd.source_newY) {
                // if target node is above the source node
                pathEnd.target_newY = (2 * d.target.y) - pathEnd.target_newY + h;
            }
        }
        if (tanRatioMoveable > tanRatioFixed) {
            // By default assume path intersects top horizontal side
            pathEnd.target_newY = d.target.y;
            if (pathEnd.target_centerY < pathEnd.source_newY) {
                // if target node is above the source node
                pathEnd.target_newY = d.target.y + h;
            }
            // By default assume path intersects towards lefthand side
            pathEnd.target_newX = pathEnd.target_centerX - ((pathEnd.target_centerY - d.target.y) / tanRatioMoveable);
            if (pathEnd.target_centerX < pathEnd.source_newX) {
                // if target node is to left of the source node
                pathEnd.target_newX = (2 * d.target.x) - pathEnd.target_newX + w;
            }
        }
        return pathEnd;
    };


    /**
     * Function for Update graph when happen any event if need update new state of graph
     */
    GraphCreator.prototype.updateGraph = function() {
        var thisGraph = this,
            consts = thisGraph.consts,
            state = thisGraph.state;

        thisGraph.paths = thisGraph.paths.data(thisGraph.edges, function(d) {
            return String(d.source.id) + "+" + String(d.target.id);
        });
      
        var paths = thisGraph.paths;
      
      // update existing paths
        paths.style('marker-end', 'url(#end-arrow)')
            .classed(consts.selectedClass, function(d) {
                var end = d3.selectAll('#end-arrow').attr('refX');
                var refX = end[0];
                return d === state.selectedEdge;
            })
            .attr("d", function(d) {
                return thisGraph.moveto(d) + thisGraph.lineto(d);
//                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
            });

        // add new paths
        paths.enter()
            .append("path")
            .attr("id", function(d) {
                return "linkId_" + d.source.id + "_" + d.target.id;
            })
            .attr('marker-end', 'url(#end-arrow)')
            .classed("link", true)
            .attr("d", function(d) {
                return thisGraph.moveto(d) + thisGraph.lineto(d);
//                return "M" + source_newX + "," + source_newY;return " L" + target_newX + "," + target_newY;
//                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
            })
            .on("mousedown", function(d) {
                thisGraph.pathMouseDown.call(thisGraph, d3.select(this), d);
            })
            .on("mouseup", function(d) {
                thisGraph.pathMouseUp.call(thisGraph, d3.select(this), d);
                state.mouseDownLink = null;
            });

        // remove old links
        paths.exit().each(function() {
            var id = $(this).attr("id").replace("linkId", "lableId");
            $(this.parentNode).find("#" + id).remove();
            this.remove();
        });

        // update existing nodes
        thisGraph.rects = thisGraph.rects.data(thisGraph.nodes, function(d) {
            return d.id;
        });
        thisGraph.rects.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        // add new nodes
        var newGs = thisGraph.rects.enter()
            .append("g");

        newGs.classed(consts.rectGClass, true)
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .on("mouseover", function(d) {
                if (state.shiftNodeDrag) {
                    d3.select(this).classed(consts.connectClass, true);
                }
            })
            .on("mouseout", function(d) {
                d3.select(this).classed(consts.connectClass, false);
            })
            .on("mousedown", function(d) {
                thisGraph.rectMouseDown.call(thisGraph, d3.select(this), d);
            })
            .on("mouseup", function(d) {
                thisGraph.rectMouseUp.call(thisGraph, d3.select(this), d);
            })
            .call(thisGraph.drag);
        // http://www.d3noob.org/2014/02/d3js-elements.html
        newGs.append("rect")
            .attr("id", "rect_node")
            .attr("width", 150)
            .attr("height", 50)
            .attr('rx', '10')
            .attr('ry', '10');

        newGs.each(function(d) {
            thisGraph.insertTitleLinebreaks(d3.select(this), d.title);
        });

        // remove old nodes
        thisGraph.rects.exit().remove();
    };

    /**
     * Handle zoom event
     * @returns {undefined}
     */
    GraphCreator.prototype.zoomed = function() {
        this.state.justScaleTransGraph = true;
        d3.select("." + this.consts.graphClass)
          .attr("transform", "translate(" 
                + d3.event.translate 
                + ") scale(" 
                + d3.event.scale + ")");
    };

    /**
     * Update width and height of svg
     * @param {type} svg
     * @returns {undefined}
     */
    GraphCreator.prototype.resize = function(w, h) {
        this.svg.attr("width", w).attr("height", h);
    };

  
    GraphCreator.prototype.addNode = function (data) {
      var finished = false;

      var existNode = this.nodes.map(function(node){return node.title;})
                      .indexOf(data.title);
      if (existNode === -1) {
        this.nodes.push(data);
        this.updateGraph();
        finished = true;
      }
      return finished;
    };
    
    /**
     * Helper function for exporting path (link) to text
     * @returns {String}
     */
    GraphCreator.prototype.exportToText = function() {
        var thisGraph = this;
        var startNode = "";
        if (thisGraph.state.selectedNode !== null) {
            startNode = thisGraph.state.selectedNode.title;
        }

        var saveEdges = [];
        thisGraph.edges.forEach(function(edge) {
            saveEdges.push({source: edge.source.title, target: edge.target.title, label: edge.label});
        });

        var text = {start: startNode, links: saveEdges};
        return JSON.stringify(text, null, '\t');
    };
  
    GraphCreator.prototype.getGraph = function() {
      var thisGraph = this;
      var start = "";
      if (thisGraph.state.selectedNode !== null) {
        start = thisGraph.state.selectedNode.id;
      } else if(thisGraph.nodes.length) {
        start = thisGraph.nodes[0].id;
      }
      
      var saveEdges = [];
      thisGraph.edges.forEach(function(edge) {
          saveEdges.push({ source: edge.source.id, 
                           target: edge.target.id, 
                           label: edge.label });
      });
      
      var bbox = $(thisGraph.svg[0]);
      return {"nodes": thisGraph.nodes, 
              "start": start, 
              "edges": saveEdges, 
              "width": bbox.width(),
              "height": bbox.height() };
    };
    
    //TBD: adjust the position(x,y) with current width and height
    GraphCreator.prototype.setGraph = function(jsonObj) {
     var thisGraph = this;
     if(jsonObj && jsonObj.edges && jsonObj.nodes) {
       thisGraph.deleteGraph(true);
       
       var nodes = jsonObj.nodes, 
           oldWidth = jsonObj.width, 
           oldHeight = jsonObj.height;
       if(oldHeight && oldWidth) {
         var bbox = $(thisGraph.svg[0]),
             ratioW = bbox.width() /oldWidth,
             ratioH = bbox.height() /oldHeight;
         nodes.map(function(node){
           node.x = Math.round(node.x * ratioW);
           node.y = Math.round(node.y * ratioH); 
           return node;
         });
       }
       thisGraph.nodes = nodes;
       
       thisGraph.setIdCt(jsonObj.nodes.length + 1);
       
       var newEdges = jsonObj.edges;
       newEdges.forEach(function(edge, i) {
           newEdges[i] = {source: thisGraph.nodes.filter(function(n) {
                   return n.id === edge.source;
               })[0],
               target: thisGraph.nodes.filter(function(n) {
                   return n.id === edge.target;
               })[0]};
       });
       thisGraph.edges = newEdges;
       thisGraph.updateGraph();
     }
    };
  
    return GraphCreator;
});