define(['./scripts/elasticsearch', 'css!./main.css'], function ( elasticsearch) {
    "use strict";
    var MyClass = function(io){
    };
    
    MyClass.prototype.render = function (containerElement, containerWidth, containerHeight) {
      
      var self = this; 
      
      var client = new elasticsearch.Client({
                host:'133.196.122.211:9200'
              });
      client.search({
          index: 'nfl',
          size: 2,
          body: {
              query: {
                  bool: {
                      must: { match: { "description": "TOUCHDOWN"}},
                      must_not: [
                          { match: { "description": "intercepted"}},
                          { match: { "description": "incomplete"}},
                          { match: { "description": "FUMBLES"}},
                          { match: { "description": "NULLIFIED"}}
                      ]
                  }
              },
              aggs: {
                  teams: {
                      terms: {
                          field: "off",
                          exclude: "", // exclude empty strings.
                          size: 2 // limit to top 5 teams (out of 32).
                      },
                      aggs: {
                          players: {
                              terms: {
                                  field: "description",
                                  include: "([a-z]?[.][a-z]+)", // regex to pull out player names.
                                  size: 5 // limit to top 20 players per team. 
                              },
                              aggs: {
                                  qtrs: {
                                      terms: {
                                          field: "qtr"
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          }
      }).then(function (resp) {
          console.log(resp);
          // D3 code goes here.
          // D3 code goes here.
      var root = createChildNodes(resp);
      // d3 dendrogram
      var width = 600,
          height = 2000;
      var color = ['#ff7f0e', '#d62728', '#2ca02c', '#1f77b4'];
      var cluster = d3.layout.cluster()
          .size([height, width - 200]);
      var diagonal = d3.svg.diagonal()
          .projection(function(d) { return [d.y, d.x]; });
      
      var container = d3.select(containerElement);
      container.select('svg').remove();
      var svg = container.append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("class", "ElasticExample")
          .append("g")
           .attr("transform", "translate(120,0)");
      var nodes = cluster.nodes(root),
          links = cluster.links(nodes);
      var link = svg.selectAll(".link")
          .data(links)
          .enter().append("path")
          .attr("class", "link")
          .attr("d", diagonal);
      var node = svg.selectAll(".node")
          .data(nodes)
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
      node.append("circle")
          .attr("r", 4.5)
          .style("fill", function (d) {
              return d.children ? "#ffffff" : color[d.key - 1];
          })
          .style("stroke", function (d) {
              return d.children ? "#4682B4" : color[d.key - 1];
          });
      node.append("text")
          .attr("dx", function(d) { return d.children ? -8 : 8; })
          .attr("dy", 3)
          .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
          .text(function(d) { return d.children? d.key : d.key + ": " + d.doc_count; });
      d3.select(self.frameElement).style("height", height + "px");
     
     self.insideResize(containerElement, containerWidth, containerHeight);
     
     function createChildNodes(dataObj) {
          var root = { };
          root.key = "NFL";
          root.children = dataObj.aggregations.teams.buckets;
          root.children.forEach(function (d) { d.children = d.players.buckets; });
          root.children.forEach(function (d) { 
              d.children.forEach(function (d) { 
                  d.children = d.qtrs.buckets; 
              });
          });
          return root;
      } //function end
    }); //then end
    }; //render end
  
    MyClass.prototype.insideResize= function(containerElement, width, height) {
        var svg = $(containerElement).find('svg')[0],
            bbox     = svg.getBBox();
        svg.setAttribute("viewBox", [bbox.x-20, bbox.y-20 , bbox.width+40, bbox.height+40]);
        svg.width.baseVal.valueAsString  = width;
        svg.height.baseVal.valueAsString = height;
    };
  
    return MyClass;
  
  });