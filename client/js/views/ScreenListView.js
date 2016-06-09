define(["js/app",
        "text!templates/screen_list.html",
        'model/ScreenListModel',
        'view/GraphEditorView',
	'lib/jquery.splitter'
       ], function (app, toolEditorTpl, ScreenListModel,GraphEditorView) {
  /**
   * Constructor create ToolEditorView
   * @method ToolEditorView
   * @memberOf ToolEditorView
  */
  var MyClass = Backbone.View.extend({
      template: _.template(toolEditorTpl),
      initialize: function (options) {
        var self = this;
         //_.extend(this, _.pick(options, "format", 'toolid'));
        _.bindAll(this, 'drawMe');
        
        this.$el.html(
          this.template({ user: app.session.user.toJSON()})
        );
        
        this.model = new ScreenListModel();
        
        var params = $.extend({el: $('<div class=editor></div>').appendTo(this.$el) }, 
                              _.pick(options, "format", 'toolid') );
        this.graphView = new GraphEditorView(params);
      },
    
      events: {
        'click .screens .imglist img'  : 'showScreen',
      },

      render: function(){
        var self = this;
        this.model.fetch(
        {
          data: {user: app.session.user.get('userId')},
          success: function (model, response, options){
            self.drawMe(response.data);
          },
          error: function(model, xhr, options) {
            console.log(xhr.responseText);
          }
        }); //only render af the first time
        return this;
      },
      
      drawMe: function(rows){
        var self = this;
        
        this.$el.splitter({
          orientation: "horizontal",
          div1: ".editor",
          div2: ".screens",
          limit: 3 //minimum size
        });
        
        var $list = this.$el.find('.imglist');
        _.each(rows, function(item){
          var figure = $('<figure/>')
                .css({
                  "background-color": "#222",
                  "border-style": "groove"
                });
          var  labelElement=$('<div>' + item.id+ '</div>')
                .attr('draggable', 'true')
                .css('cursor', 'pointer')
                .on('dragstart', self.graphView.onDragSnapshotItem);
          
          var imgElement = $("<img>")
                .attr('src', 'api/snapshot/'+item.imgurl+'.jpg?'+ Math.random()* 1000000)
                .attr('alt', item.id)
                .attr('title', 'description: '+ item.description)
                .attr('draggable', 'false');
          figure.append(labelElement).append(imgElement);
         
          $list.append(figure);
        });
      },
    
      showScreen: function(e){
        e.preventDefault();
        framework.mediator.trigger(
          'middleview:bookmarkedView',
          $(e.currentTarget).attr('alt')
        );
      }
  });

  return MyClass;
});
