/**
 * @desc		stores the POST state and response state of authentication for user
 */
define([
    "js/app"
], function(app){

    var UserModel = Backbone.Model.extend({

        defaults: {
            id: '',
            description: '',
            email: ''
        },

        url: function(){
            return app.API + '/user';
        }

    });
   
    return UserModel;
});

