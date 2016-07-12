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
        
        /*var imglist_templete = $('<div/>').addClass('screens')
           .append($('<div/>').addClass('imglist'));
        */
        
        this.$el.html(
          this.template({ user: app.session.user.toJSON()})
        );
        
        this.model = new ScreenListModel();
        
        var params = $.extend({el: $('<div class=editor></div>').appendTo(this.$el) }, _.pick(options, "format", 'toolid') );
        this.graphView = new GraphEditorView(params);
      },
    
      events: {
        'click .screens .imglist img'  : 'showScreen',
        'click .screens .imglist button.event-del'  : 'onDeleteScreen',
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

          var titleElement  = $('<div>' + item.id+ '</div>').css('position','relative'),
              deleteButton  = $('<button>' + 'X' + '</button>').addClass('event-del').appendTo(titleElement);

          var imgElement = $("<img>")
                .attr('src', 'api/snapshot/'+item.imgurl+'.jpg?'+ Math.random()* 1000000)
                .attr('alt', item.id)
                .attr('id', item.id)
                .attr('title', 'description: '+ item.description)
                .attr('draggable', 'true')
                .css('cursor', '-webkit-grab')
                .on('dragstart', self.graphView.onDragSnapshotItem);
          figure.append(titleElement).append(imgElement);
         
          $list.append(figure);
        });
      },
    
      showScreen: function(e){
        e.preventDefault();
        framework.mediator.trigger(
          'middleview:bookmarkedView',
          $(e.currentTarget).attr('alt')
        );
      },

       onDeleteScreen: function(ev){
        ev.preventDefault();
        var $clickedButtonElement = $(ev.currentTarget);
        var $img = $clickedButtonElement.parent().siblings('img');
        
        var del = confirm("Are you sure for deleting this screen?");
        if (del === true) {

          var params  = "id="+$img.attr('id');
          //params += "&format="+ $img.attr('data-format');
          params += "&user="+ app.session.user.get('userId');

          //delete data in database
          $.ajax({ //query databases worker
           url: app.API + '/screen?' +params,
           //data: data, //delete can not use the params
           type: 'DELETE', //or GET if no options' data
           timeout: 10000, //ms
          }).done(function(response, textStatus, jqXHR) {
             $img.parent().remove();
          }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log('error when deleting screen!');
          });
        }
      }, //function end
  });

  return MyClass;
});
