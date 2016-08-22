define(["js/app",
        'text!templates/graph_editor.html',
        'util/graph/GraphCreator',
        'model/ToolModel',
        'ctrl/ScreenCtrl'
       ],
       function (app, graphTpl, GraphCreator, ToolModel, GraphCtrl) {
  /**
   * Constructor create Graph
   * @method GraphView
   * @memberOf GrapghView
  */
  var GraphView = Backbone.View.extend({
      template: _.template(graphTpl),
    
      initialize: function (options) {
        var self = this;
        _.extend(this, _.pick(options, 'toolid', 'format'));//input params if existed
        _.bindAll(this, 'render');
        
        this.$el.html(this.template());
        
        if(!this.toolid) {
          this.model = new ToolModel({ 
            user: app.session.user.get('id'),
            format: this.format
          });
          this.render();
        } else {
          this.model = new ToolModel({ id: this.toolid });
          
          this.model.fetch({
            silent: true,
            data: {
              id: this.toolid,
              format: this.format,
              user: app.session.user.get('id')
            },
            success: function(model, response, options) {
              self.render();
            },
            error: function(model, xhr, options){
              console.log('can not get tool data!');
            }
          });
        }
        
        //listen to resize event?
        //this.$el.resize(this.resize);
      },
      
      events: {
        'drop .graph-container': 'onDropSnapshotItem',
        'dragover .graph-container': function(event) {
          event.preventDefault();
        },
        'click .button-container input[name=save]': 'saveTool'
      },
       
      render: function() {
        var self = this;
        // Initialize graph
        var container = this.$el.find(".graph-container");
        var graph = this.model.get('graph');
        
        this.graph = new GraphCreator(container, [],[]);//nodes, edges 
        this.graph.setGraph(this.model.get('graph'));
      },
    
      /**
       * Listen event went drag snapshot item from list. Transfer data when drag
       * @param {type} ev
       */
      onDragSnapshotItem: function(ev) {
        // Get title of node from p tag
        var title = $(ev.target).attr('id');
        if (title) {
          ev.originalEvent.dataTransfer.setData("data",
            JSON.stringify({title: title, from: 'screenItem'}));
        }
      },
    
      /**
       * Listen event drop snapshot item to graph editor area
       * @param {type} ev
       */
      onDropSnapshotItem: function(ev) {
        ev.preventDefault();
        // get data when transfer
        var data = ev.originalEvent.dataTransfer.getData("data");
        if (!JSON.parse(data)) {
          return;
        } else {
          data = JSON.parse(data);
        }

        if (data.from === "screenItem") {
          var node = {title: data.title, id: data.title,
                     x: ev.originalEvent.offsetX, y: ev.originalEvent.offsetY};
          if(!this.graph.addNode(node)) {
             alert("The node have title " + data.title   + 
                   " is exist from Graph. Please select other node");
          }
        }
      },
    
      saveTool: function (ev){
        var self = this;
        var ctrl = new GraphCtrl();
        ctrl.inputDlg(this.model.get('id'))
          .done(function(options){
          var imagename = 'tool.'+ self.model.get('user') + '.'+options.id;
          self.model.set(
            $.extend({}, options, { imgurl: imagename, graph: self.graph.getGraph() }));
          self.model.save();//?
          
          var $svg =  self.$el.find('.graph-container > svg' ),
              $canvas = self.$el.find('.graph-container canvas' );
          
          ctrl.captureSimple($svg, $canvas)
            .done(function (img){                                                        
             ctrl.saveImg('api/snapshot/' + imagename, img);
          }).fail(function(err){
            //
          });
          
        })
          .fail(function(){
          //maybe the action be canceled by user.
        });
      },
    
      //a dom element wont triiger a resize event. 
      resize: function() {
        self.graph.resize(this.$el.width(), this.$el.height());
      }
    
    });
    return GraphView;
});
  