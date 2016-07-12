define(["js/app",
        "text!templates/tool_list.html",
        "text!templates/tool_list_image.html"
       ],
       function (app, toolsTpl, imgTpl) {
  /**
   * Constructor create BookmarksView
   * @method BookmarksView
   * @memberOf module.BookmarksView
  */
  var MyClass = Backbone.View.extend({
      
      initialize: function () {
        var self = this;
        
        _.bindAll(this, 'render');
        this.$el.html(_.template(toolsTpl)({ user: app.session.user.toJSON()}));
        
        var data = { user: app.session.user.get('userId') };
        if(this.model.get('data')) {
          $.extend(data, {format: this.model.get('data').format });
        } 
        
        $.ajax({ //query databases worker
         url: app.API + '/tool',
         type: 'GET', //or GET if no options' data
         timeout: 10000, //ms
         data: data,
        }).done(function(response, textStatus, jqXHR) {
           self.render(response);
        }).fail(function(jqXHR, textStatus, errorThrown) {
          console.log('error when geting datalist!');
        });
      },
    
      events: {
        'click .tools .imglist img'  : 'selectedTool',
        'click .tools .imglist button.event-del'  : 'onDeleteTool',
        'click .tools .imglist button.event-edit'  : 'onEditTool',
      },

      render: function(rows){ //to add format
        var self = this;
        if(rows.length) {
          var $list = this.$el.find('.tools .imglist');
          var img_template = _.template(imgTpl);
          _.each(rows, function(tool){
            var img = img_template({
              id: tool.id,
              format: tool.format,
              src: 'api/snapshot/'+tool.imgurl+'.jpg?'+ Math.random()* 1000000,
              title: 'description: '+ tool.description,
              alt: tool.imgurl,
            });
            $list.append(img);
          });
        } else {
           framework.mediator.trigger( 'middleview:selectedTool', null ); 
        }
      },
    
      selectedTool: function(ev){
        ev.preventDefault();
        var $img = $(ev.currentTarget);
        framework.mediator.trigger( 'middleview:selectedTool', { 
            id: $img.attr('data-id'),
            format: $img.attr('data-format') 
        });
      },
    
      onDeleteTool: function(ev){
        ev.preventDefault();
        var $clickedButtonElement = $(ev.currentTarget);
        var $img = $clickedButtonElement.parent().siblings('img');
        
        var del = confirm("Are you sure for deleting this tool?");
        if (del === true) {
          var params  = "id="+$img.attr('data-id');
          params += "&format="+ $img.attr('data-format');
          params += "&user="+ app.session.user.get('userId');

          //delete data in database
          $.ajax({ //query databases worker
           url: app.API + '/tool?' +params,
           //data: data, //delete can not use the params
           type: 'DELETE', //or GET if no options' data
           timeout: 10000, //ms
          }).done(function(response, textStatus, jqXHR) {
             $img.parent().remove();
          }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log('error when deletinh tool!');
          });
        }
      }, //function end
    
      onEditTool: function(ev) {
        ev.preventDefault();
        var $clickedButtonElement = $(ev.currentTarget),
            $img = $clickedButtonElement.parent().siblings('img');
        framework.mediator.trigger( 'middleview:showScreenList', $img.attr('data-id'));
      },
    
  });

  return MyClass;
});
    