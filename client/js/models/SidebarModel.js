/*
model/collection.fetch() >> GET
model.save() >> POST (isNew())
model.save() >> PUT  (!isNew())
model.destroy() >> DELETE
*/
define(function () {
  var sidebar = Backbone.Model.extend({
      defaults: {
        hideMe: false,
        histories: {}
      },
      urlRoot: '/api/sidebar',
      initialize: function (attrs, options) {
        Backbone.on('Aside:toggleMe', this.toggleMe, this);
      },
      toggleMe: function () {
        this.save('hideMe', !this.get('hideMe'), {wait: true});//change to save method with {wait: true}
      }
    });
  return sidebar;
});
