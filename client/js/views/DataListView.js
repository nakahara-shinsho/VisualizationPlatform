define([ "js/app",
         'text!templates/data_list.html'], function (app, myTpl) {

  var MyClass = Backbone.View.extend({
    template: _.template(myTpl),
    initialize: function (options) {
      _.bindAll(this, 'render');
      var self = this;
      this.$el.html( this.template());
      this.user = app.session.user.get('id');
      var data = { user: this.user };
      if(this.model.get('tool')) {
        $.extend(data, {format: this.model.get('tool').format });
      }
      $.ajax({ //query databases worker
        url: app.API + '/data/datalist',
        type: 'POST', //or GET if no options' data
        dataType: "json",
        timeout: 30000, //10s
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
      "dblclick table tr.clickable_row": 'selectRow',
      //"click td.view": 'selectProject'
    },
    // Render FooterView
    render: function (response) {
      if(response && response.format.toLowerCase() ==="json" && response.filled.list) {
        //this.$el.html(this.template({data: response.filled.list}));
        //drawchart with response.filled.chart
         var dlist = response.filled.list,
             $lheader = this.$el.find('#datalist_header'),
             $lbody = this.$el.find('#datalist_body');
         
         for(var key in dlist[0]) {  //add header
           $lheader.append("<th>"+ key + "</th>");
         }
         dlist.forEach(function(dline) { //add body
           var $line = $("<tr class='clickable_row'>").appendTo($lbody);
            for(var key in dline) {
              $line.append("<td>"+ dline[key] + "</td>");
            }
            $line.data('row_id', dline);
            $line.data('row_format', (dline.format)?dline.format: 'default');
         });
      }
      return this;
    },
    selectRow: function(ev){
      var row_id     = $(ev.currentTarget).data("row_id");
      var row_format = $(ev.currentTarget).data("row_format");
      framework.mediator.trigger( 'middleview:selectedData',
                                   { id: JSON.stringify(row_id), format: row_format } );
    },
    selectProject: function(ev){
      var row_id     = $(ev.currentTarget).data("id");
      var row_format = $(ev.currentTarget).data("format");
      framework.mediator.trigger( 'middleview:selectedData',
                                  { id: JSON.stringify(row_id), format: row_format } );
    }
  });
  return MyClass;
});
