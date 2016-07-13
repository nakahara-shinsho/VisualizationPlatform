/**
 * Create SidebarView main function
 * @class SidebarView
 * @param {type} sidebarTpl - sidebar.html template
 * @param {type} SidebarModel SidebarModel class (SidebarModel.js)
 * @returns {SidebarView}
 */
define(["js/app",
        "text!templates/sidebar.html",
        'model/SidebarModel',
       ], function (app, sidebarTpl, SidebarModel) {

  /**
   * Constructor create SidebarView
   * @method SidebarView
   * @memberOf SidebarView
  */
    var SidebarView = Backbone.View.extend({
      template: _.template(sidebarTpl),
      initialize: function (options) {
        _.extend(this, _.pick(options, "parent"));//input params if existed
      },
      
	  events: {
        //"click i.fa-undo"   : 'onUndoBtnClicked',
        //"click i.fa-repeat" : 'onRedoBtnClicked',
        "click button.event-clip" : 'onBookmarkMe',
        "click button.event-update-image" : 'onUpdateSnapshot',
        "click button.event-download-image" : 'onDownloadSnapshot', //trigger screen snapshot
        "click button.event-new" : 'OnNewScreen', //trigger screen snapshot
        "click button.event-pre-screen" : 'onPreScreen' ,
        "click button.event-first-screen" : 'onFirstScreen',
        "click button.event-next-screen" : 'onNextScreen',
        "click button.event-caption" : 'onToggleCaption',
        "click button.event-fit2window" : 'onFitToWindow',
        "click button.event-clear-filter" : 'onClearFilter',
      },
            
      // Render SideBarView
      render: function () {
        this.$el.html(this.template());
        return this;
      }, //render end
      // Trigger event when user click undo button
      onUndoBtnClicked : function () {
        //framework.undoer.undo();
      },
      onRedoBtnClicked : function () {
        //framework.undoer.redo(); 
      },
      onDownloadSnapshot: function () {
        if(this.parent) {
          this.parent.downloadImage();
        }
      },
      onUpdateSnapshot: function() {
        if(this.parent) {
          this.parent.updateImage();
        }
      },
      onBookmarkMe: function() {
       if(this.parent) {
          this.parent.bookmarkMe();
        }
      },
      OnNewScreen: function() {
        if(this.parent) {
          this.parent.newScreen();
        }
      },
      onPreScreen: function(){
        if(this.parent) {
          this.parent.shiftToPreScreen();
        }
      },
      onFirstScreen: function(){
        if(this.parent) {
          this.parent.shiftToFirstScreen();
        }
      },
      
      onNextScreen: function(evt) {
         if(this.parent) {
          this.parent.shiftToNextScreen(evt);
        }
      },
    
      onToggleCaption: function(){
        framework.mediator.trigger('board:toggle-caption');
      },
      
      onFitToWindow: function(){
        framework.mediator.trigger('boardmanager:fit2window', index=0);
      },

      onClearFilter: function(){
        framework.mediator.trigger('board:clear-filter');
      },
      
    });
    return SidebarView;
  });
