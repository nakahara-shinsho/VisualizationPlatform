define([ "js/app",
         'text!templates/data_list.html'], function (app, myTpl) {

  var MyClass = Backbone.View.extend({
    template: _.template(myTpl),
    initialize: function (options) {
      _.bindAll(this, 'render');
      var self = this;
      this.user = app.session.user.get('userId');
      var data = { user: app.session.user.get('userId') };
      if(this.model.get('tool')) {
        $.extend(data, {format: this.model.get('tool').format });
      }
      $.ajax({ //query databases worker
        url: app.API + '/data/datalist',
        type: 'POST', //or GET if no options' data
        dataType: "json",
        timeout: 10000, //10s
        data: data
      })
      .done(function(response, textStatus, jqXHR) {
          self.render(response);
         })
      .fail(function(jqXHR, textStatus, errorThrown) {
          console.log(errorThrown);
          window.alert( "データリスト取得にエラーが発生しました! " + errorThrown  ) ;
        });
    },
    // Events
    events: {
      "click table tr.clickable_row": 'selectRow',
      "click td.view": 'selectProject'
    },
    // Render FooterView
    render: function (response) {
      if(response &&
         response.format.toLowerCase() ==="json" &&
         response.filled.list) {
        this.$el.html(this.template({data: response.filled.list}));
        //drawchart with response.filled.chart
      }
      return this;
    },
    selectRow: function(ev){
      var id     = $(ev.currentTarget).find('td.name').html();
      var format = $(ev.currentTarget).find('td.format').html();
      framework.mediator.trigger( 'middleview:selectedData',
                                  { id: id,  format: format } );
    },
    selectProject: function(ev){
      var id     = $(ev.currentTarget).attr("name");
      var format = $(ev.currentTarget).attr("format");
      framework.mediator.trigger( 'middleview:selectedData',
                                  { id: id, format: format } );

    }
  });
  return MyClass;
});
