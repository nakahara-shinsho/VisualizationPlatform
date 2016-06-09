
/**
 * Main app initialization and initial auth check
 */
require(["js/app", "js/router", "model/SessionModel"],
        function(app, WebRouter, SessionModel) {

    // Just use GET and POST to support all browsers
    Backbone.emulateHTTP = true;//

    app.router = new WebRouter();

    // Create a new session model and scope it to the app global
    // This will be a singleton, which other modules can access
    app.session = new SessionModel({});

    // Check the auth status upon initialization,
    // before rendering anything or matching routes
    app.session.checkAuth({
        // Start the backbone routing once we have captured a user's auth status
        complete: function(){
            // HTML5 pushState for URLs without hashbangs
            var hasPushstate = !!(window.history && history.pushState);
            if(hasPushstate) Backbone.history.start({ pushState: true, root: '/' });
            else Backbone.history.start();
        }
    });

});


