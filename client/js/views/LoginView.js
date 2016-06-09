/**
 * Create LoginView main function
 * @class LoginView
 * @param {type} app
 * @param {type} LoginPageTpl - login html template
 * @returns {LoginView}
 */
define([
    'js/app',
    'text!templates/login.html',
    'parsley'
], function(app, LoginPageTpl) {
  /**
   * Constructor create LoginView
   * @method LoginView
   * @memberOf LoginView
  */
  var LoginView = Backbone.View.extend({

    initialize: function () {
        _.bindAll(this, 'render');
    },
    // Set event name for html element in LoginView
    events: {
      'click #login-btn'                      : 'onLoginAttempt',
      'click #signup-btn'                     : 'onSignupAttempt',
      'keyup #login-password-input'           : 'onPasswordKeyup',
      'keyup #signup-password-confirm-input'  : 'onConfirmPasswordKeyup'
    },

    // Allow enter press to trigger login
    onPasswordKeyup: function(evt){
      var k = evt.keyCode || evt.which;

      if (k == 13 && $('#login-password-input').val() === ''){
        evt.preventDefault();    // prevent enter-press submit when input is empty
      } else if(k == 13){
        evt.preventDefault();
        this.onLoginAttempt();
        return false;
      }
    },

    // Allow enter press to trigger signup
    onConfirmPasswordKeyup: function(evt){
      var k = evt.keyCode || evt.which;

      if (k == 13 && $('#confirm-password-input').val() === ''){
          evt.preventDefault();   // prevent enter-press submit when input is empty
      } else if(k == 13){
          evt.preventDefault();
          this.onSignupAttempt();
          return false;
      }
    },
    // Check login with userId and password
    onLoginAttempt: function(evt){
      if(evt) evt.preventDefault();

      if(this.$("#login-form").parsley('validate')){
        app.session.login({
            userId: this.$("#login-username-input").val(),
            password: this.$("#login-password-input").val()
        }, {
            success: function(mod, res){
                if(DEBUG) console.log("SUCCESS", mod, res);
            },
            error: function(err){
                if(DEBUG) console.log("ERROR", err);
                app.showAlert('Bummer dude!', err.error, 'alert-danger');
            }
        });
      } else {
        // Invalid clientside validations thru parsley
        if(DEBUG) console.log("Did not pass clientside validation");

      }
    },
    // Handle signup event
    onSignupAttempt: function(evt){
        if(evt) evt.preventDefault();
        if(this.$("#signup-form").parsley('validate')){
            app.session.signup({
                username: this.$("#signup-username-input").val(),
                password: this.$("#signup-password-input").val(),
                //description: this.$("#signup-description").val()
            }, {
                success: function(mod, res){
                    if(DEBUG) console.log("SUCCESS", mod, res);
                },
                error: function(err){
                    if(DEBUG) console.log("ERROR", err);
                    app.showAlert('Uh oh!', err.error, 'alert-danger');
                }
            });
        } else {
            // Invalid clientside validations thru parsley
            if(DEBUG) console.log("Did not pass clientside validation");

        }
    },
    // Render LoginView
    render:function () {
      this.template = _.template(LoginPageTpl);
      this.$el.html(this.template({ user: app.session.user.toJSON() }));
      return this;
    }
  });

  return LoginView;

});

