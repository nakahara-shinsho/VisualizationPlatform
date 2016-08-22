/**
 * Create MiddleView main function
 * @class MiddleView
 * @param {type} app
 * @param {type} middleTpl
 * @param {type} SidebarView
 * @param {type} BoardManagerView
 * @param {type} DataMapingPanel
 * @param {type} ControlPanel
 * @param {type} ManagementPageView
 * @param {type} ManagementVTPageView
 * @returns {MiddleView}
 */
define([
  'js/app',
  'view/ScreenView',
  'view/LoginView',
  'view/ManagementPageView',
  'view/ManagementVTPageView',
  'view/ScreenListView',
  'view/DataListView',
  'view/ToolListView',
  'model/StatusModel'
], function (
  app,
  ScreenView,
  LoginView,
  ManagementPageView,
  ManagementVTPageView,
  ScreenListView,
  DataListView,
  ToolListView,
  StatusModel
) {
  /**
   * Constructor create MiddleView
   * @method MiddleView
   * @memberOf MiddleView
  */
  var MiddleView = Backbone.View.extend({
    initialize: function () {
      _.bindAll(this, 'render');
      app.session.on("change:logged_in", this.render);

      this.listenTo(framework.mediator, 'middleview:accessManagement',this.setAccessManagement);
      this.listenTo(framework.mediator, 'middleview:home', this.setHomePage);
      this.listenTo(framework.mediator, 'middleview:vtmanager', this.setVTEditor);
      this.listenTo(framework.mediator, 'middleview:bookmarkedView', this.setHomePage);
      this.listenTo(framework.mediator, 'middleview:bookmarks', this.setBookmarksPage);
      this.listenTo(framework.mediator, 'middleview:selectedTool', this.hasSelectedTool);
      this.listenTo(framework.mediator, 'middleview:selectedData', this.hasSelectedData);
      this.listenTo(framework.mediator, 'middleview:showDataList', this.showDataList);
      this.listenTo(framework.mediator, 'middleview:showToolList', this.showToolList);
      this.listenTo(framework.mediator, 'middleview:showScreenList',this.showToolEditor);

      this.model = new StatusModel({user: app.session.user.get('id')});

      var self = this;
      this.model.fetch({
            silent: true,
            data: { user: app.session.user.get('id') },
            success: function(model, response, options) {
              window.framework.context = 
                {_format_: model.get('data').format, _database_:model.get('data').id};
              self.render();
            },
            error: function(model, xhr, options){
              console.log('can not get status data!');
            }
      });
    },
    
     //
     render: function() {
       if(this.currentView) {  this.currentView.remove(); }
       
       if(app.session.get("logged_in")) {
          if( _.isEmpty(this.model.get('data'))){
            this.currentView = new DataListView({
              el: $('<div>',{id: 'middle'}).appendTo(this.$el), model: this.model
            });
          } else if( _.isEmpty(this.model.get('tool'))) {
             this.currentView = new ToolListView({
              el: $('<div>',{id: 'middle'}).appendTo(this.$el), model: this.model
            });
          } else {
            this.currentView = new ScreenView({
              el: $('<div>',{id: 'middle'}).appendTo(this.$el),
              status: this.model
            }).render();
          }
        } else {
          this.currentView = new LoginView(
            {el: $('<div>',{id: 'middle'}).appendTo(this.$el)}).render();
        } 
     },
  
      /**
       * Set middle area is home page where contain charts
       */
      setHomePage: function (screenid) {
        //if (!(this.currentView instanceof ScreenView)) {
          this.currentView.remove();
          if(screenid) { //come from selecting item of in screen list
            this.currentView = new ScreenView({
              el: $('<div>',{id: 'middle'}).appendTo(this.$el), 
              screenid: screenid 
            }).render();
          } else { //come from Home Button
            this.render();
          }
        //}
      },
      
      showToolEditor: function (toolid) {
        if (!(this.currentView instanceof ScreenListView)) {
          this.currentView.remove();
          var options = {
            el: $('<div>',{id: 'middle'}).appendTo(this.el),
            format: this.model.get('data').format
          };
          if(toolid) {  options.toolid = toolid; }
          this.currentView = new ScreenListView(options).render();
        }
      },
      
      /**
       * Set middle area is vitual table management view
       */
      setVTEditor: function () {
        if (!(this.currentView instanceof ManagementVTPageView)) {
          this.currentView.remove();
          this.currentView = new ManagementVTPageView({
            el: $('<div>',{id: 'middle'}).appendTo(this.el)
          });
        }
      },
      /**
       * Set management page to middle
       */
      setAccessManagement: function () {
        if (!(this.currentView instanceof ManagementPageView)) {
          this.currentView.remove();
          this.currentView = new ManagementPageView({
            el: $('<div>',{id: 'middle'}).appendTo(this.el)
          });
        }
      },
    
      hasSelectedTool: function(selectedTool) { //
        if(selectedTool) {
          this.model.set('tool', selectedTool);
        }
        //next view
        this.currentView.remove();
        if ( _.isEmpty(this.model.get('data'))) {
          this.currentView = new DataListView({
            el: $('<div>',{id: 'middle'}).appendTo(this.el), model: this.model
          });
        } else { //show screenView
          　this.currentView = new ScreenView({
            　el: $('<div>',{id: 'middle'}).appendTo(this.$el),status: this.model 
          }).render();
        }
      },
      hasSelectedData: function(selectedData) {
        if(selectedData) {
          this.model.set('data', selectedData);
          //next view
          this.currentView.remove();
          if ( _.isEmpty(this.model.get('tool')) ||
              this.model.get('tool').format !== this.model.get('data').format ) {
            this.currentView = new ToolListView({
              el: $('<div>',{id: 'middle'}).appendTo(this.el), model: this.model
            });
          } else { //show screenView
            this.currentView = new ScreenView({
              el: $('<div>',{id: 'middle'}).appendTo(this.$el),status: this.model 
            }).render();
          }
        } else {
          console.log('should not arrive here!');//should
        }
      },
      showDataList: function() {
        if(!(this.currentView instanceof DataListView)){
          this.currentView.remove();
          this.currentView = new DataListView({
              el: $('<div>',{id: 'middle'}).appendTo(this.el), model: this.model
            });
        }
      },
    
      showToolList: function() { 
        if(!(this.currentView instanceof ToolListView)){
          this.currentView.remove();
          this.currentView = new ToolListView({
              el: $('<div>',{id: 'middle'}).appendTo(this.el), model: this.model
            });
        }
      } //function end
      
    });
  return MiddleView;
});
