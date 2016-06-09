/**
 * @desc        backbone router for pushState page routing
 */

define([
  "js/app",
  "model/SessionModel",
  "model/UserModel",
  "view/IndexView"
], function(app, SessionModel, UserModel, IndexView){

    var WebRouter = Backbone.Router.extend({

        initialize: function(){
          _.bindAll(this, 'show', 'index');
        },

        routes: {
            "" : "index"
        },

        show: function(options){

            // Every page view in the router should need a header.
            // Instead of creating a base parent view, just assign the view to this
            // so we can create it if it doesn't yet exist
          
            // Close and unbind any existing page view
            if(this.viewInstance) this.viewInstance.close();

            // Establish the requested view into scope
            this.viewInstance = new IndexView();

            //Render inside the page wrapper
            this.viewInstance.render();
          
        },

        index: function() {
          // Fix for non-pushState routing (IE9 and below)
          var hasPushState = !!(window.history && history.pushState);
          if(!hasPushState) {
            this.navigate(
              window.location.pathname.substring(1),
              {trigger: true, replace: true}
            );
          }
          else {
            this.show();
          }
        }

    });

    return WebRouter;

});
