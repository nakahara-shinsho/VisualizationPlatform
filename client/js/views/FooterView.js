/**
 * Create FooterView main function
 * @class FooterView
 * @param {type} app - app.js
 * @param {type} footerTpl - Footer html template
 * @returns {FooterView}
 */
define([ "js/app", 
        'text!templates/footer.html'
       ], function (app, footerTpl) {
  
  var MyClass = Backbone.View.extend({
		
		template: _.template(footerTpl),
    
		initialize: function () {
		},
    // Render FooterView
    render: function () {
      if(DEBUG) console.log("footer RENDER::", app.session.toJSON());
      this.$el.html(this.template({
          logged_in: app.session.get("logged_in"),
          user: app.session.user.toJSON()
      }));
      return this;
    },
    
    
	});
	
	return MyClass;
});


