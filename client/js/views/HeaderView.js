/**
 * Create ManagementPageView main function
 * @class ManagementPageView
 * @param {type} app - app.js
 * @param {type} headerTpl - Header html template
 * @param {type} SignupView SignupView class
 * @param {type} ManagementPageLoginView ManagementPageLoginView class
 * @returns {ManagementPageView}
 */
define([
    "js/app",
    "text!templates/header.html",
    "view/SignupView",
	"view/ManagementPageLoginView"
], function(app, headerTpl, SignupView, ManagementPageLoginView){
    /**
     * Constructor create HeaderView
     * @method HeaderView
     * @memberOf HeaderView
    */
    var HeaderView = Backbone.View.extend({

        template: _.template(headerTpl),

        initialize: function () {
             _.bindAll(this, 'render');
            // Listen for session logged_in state changes and re-render
            app.session.on("change:logged_in", this.render);
            
            this.listenTo(framework.mediator, 'headerview:toolid', this.updateToolid);
            this.listenTo(framework.mediator, 'headerview:screenid', this.updateScreenid);
            
         },
        // Set event name for html elements
       events: {
            //"mouseover button.event-breadcrumb"       : 'onShowBreadcrumb',
            //"click button.event-breadcrumb"       : 'onShowBreadcrumb',
            "click button.event-home"       : 'onHomeBtnClicked',
            'click button.event-database' : 'onVTManagementBtnClicked',//
            'click button.event-data-selection' : 'onShowDataListClicked',//
            'click button.event-tool-selection' : 'onShowToolListClicked',
            'click button.event-tool-editor' : 'onShowScreenList', //Screen List 
            'click button.event-signout': 'onLogoutClick',
            //'click i.fa-user-plus': 'onClickAddNewUser',
            'click button.event-access': 'onClickManagementLogin'
        },
          
        // Handle event change login status
      /* onLoginStatusChange: function(evt){
            this.render();
            if(app.session.get("logged_in")) {
              app.showAlert("Success!", "Logged in as " + app.session.user.get("id"), "alert-success");
            }
            else {
              app.showAlert("See ya!", "Logged out successfully", "alert-success");
            }
        },
      */
        updateToolid: function(toolid) {
            this.$el.find('.event-breadcrumb>i').text("TOOL: "+toolid);
        },
        
        updateScreenid: function(screenid) {
            this.$el.find('.event-screen>i').text("SCREEN: "+screenid);
        },
        
        onShowBreadcrumb: function($target) {
           framework.mediator.trigger('screenview:breadcrumb', $target);
        },
              
        // Handle logout event when user click logout button
        onLogoutClick: function(evt) {
            evt.preventDefault();
            app.session.logout({}); // No callbacks needed b/c of session event listening
        },
        
        // Remove account event
        onRemoveAccountClick: function(evt){
            evt.preventDefault();
            app.session.removeAccount({});
        },
        
        // Handle add new user event when user click add user button
        onClickAddNewUser: function(){
          this.signupView = new SignupView();
          this.signupView.render();
        },
          // Render HeaderView
        render: function () {
            var self = this;
            
            if(DEBUG) console.log("header RENDER::", app.session.toJSON());
            this.$el.html(
              this.template({
                logged_in: app.session.get("logged_in"),
                user: app.session.user.toJSON()
              })
            );
          
            this.$el.find('button.event-breadcrumb')
                .click(function(){
                    self.onShowBreadcrumb($(this));
                })
                .mouseenter( function(evt){
                    var $me = $(this);
                    var timeoutId = setTimeout(function() {
                        self.onShowBreadcrumb($me);
                    }, 1000);
                    $me.mouseleave(function() {
                        clearTimeout(timeoutId);
                    });
            });
            
            return this;
        },
      
        //Trigger back home event
        onHomeBtnClicked: function () {
          framework.mediator.trigger('middleview:home');
        },
        
        //Trigger event of showing snapshots
        onShowBookmarks: function(){
          framework.mediator.trigger('middleview:bookmarks');
        },
      
        //Trigger event of showing snapshots
        onShowScreenList: function(){
          framework.mediator.trigger('middleview:showScreenList');
        },
        // Trigger event when user click vtmanager button
        onVTManagementBtnClicked: function () {
          framework.mediator.trigger('middleview:vtmanager');
        },
		    /**
         * Open management login view
         */
        onClickManagementLogin: function () {
          framework.mediator.trigger('middleview:accessManagement');
        },
        /*onShowScreenListClicked: function(){
          framework.mediator.trigger('middleview:showToolList');
        },*/
        onShowDataListClicked: function() {
          framework.mediator.trigger('middleview:showDataList');
        },
        onShowToolListClicked: function() {
          framework.mediator.trigger('middleview:showToolList');
        }
    });

    return HeaderView;
});
