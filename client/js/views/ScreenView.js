/**
 * Create MiddleView main function
 * @class MiddleView
 * @param {type} app
 * @param {type} ScreenCtrl
 * @param {type} SidebarView
 * @param {type} BoardManagerView
 * @returns {MiddleView}
 */
define([
  'js/app',
  'ctrl/ScreenCtrl',
  'view/SidebarView',
  'view/BoardManagerView',
  'model/ToolModel'
], function (
	app,
  ScreenCtrl,
	SidebarView,
	BoardManagerView,
  ToolModel
) {
  /**
   * Constructor create MiddleView
   * @method MiddleView
   * @memberOf MiddleView
  */
  var ScreenView = Backbone.View.extend({
      
      initialize: function (options) {
        _.extend(this, _.pick(options, "screenid", "status"));//input params if existed
        _.bindAll(this, 'drawWithScreenId', 'drawWithScreenId', 'drawWithTool', 
                  'updateControl', 'render');
        
        this.URL = {
          new_screen: '/api/screen_new',
          clone_screen: '/api/screen_clone',
          last_screen: '/api/screen_lastest',
          snapshot_root: 'api/snapshot/'
        };
        
        this.context = {};
        this.screenCtrl = new ScreenCtrl(app.session.user.get('id'));
        this.listenTo(framework.mediator, 'screenview:breadcrumb', this.showBreadcrumb);
        this.listenTo(framework.mediator, 'screenview:screenid', this.shiftToScreen);
      },
 
     /**
     * Render MiddleView
     */
      render: function () {
        // first draw the sidebarview
        if (!this.sidebarView) {
          this.sidebarView = new SidebarView(
            {el: $('<aside/>').appendTo(this.$el), parent: this});
          this.sidebarView.render();
        }
        //then draw the main the screen after login
        if(!this.screenid) { //get unique screenid of the user
          if(!this.status ||  _.isEmpty(this.status.get('tool'))){
            this.drawWithoutScreenId();
          } else {
            this.drawWithTool(); //first screen
          }
        } else {
          this.drawWithScreenId();
        } //if-else-end
        
        return this;
      },
      
      drawWithTool: function() {
        var self = this;
        var toolid  = this.status.get('tool').id;
        var toolModel = new ToolModel({id: toolid});
        toolModel.fetch({
            data: { 
                user: app.session.user.get('id'),
                format: this.status.get('data').format
            },
            success: function(model, response, options) {
              //update screenid in header
              framework.mediator.trigger('headerview:toolid', toolid); 
              //draw screen
              var graph = model.get('graph');
              self.graph = (typeof graph=='object')? graph: JSON.parse(graph);
              var screenid = self.findFirstScreen();
              if(screenid) {
                self.screenid = screenid;
                self.drawWithScreenId();
              } else {
                self.drawWithoutScreenId();
              }
            },
            error: function(model, xhr, options){
              console.log('can not get tool data!');
              //re-render
              //self.status.unset('tool');
              self.drawWithoutScreenId();
            }
          });
        return this;
      },
      
      findFirstScreen: function() {
        var screenid = null;
        if(this.graph) {
          if(this.graph.start && !_.isEmpty(this.graph.start)){
            screenid = this.graph.start;
          }
          else if(this.graph.edges && !_.isEmpty(this.graph.edges)){
            var id = this.graph.edges[0].source;
            var nodes = this.graph.nodes.find(function(node){
              if(id == node.id) return true;
              return false;
            });
            screenid = nodes.id;
          }
          else if(this.graph.nodes && !_.isEmpty(this.graph.nodes)){
            screenid = this.graph.nodes[0].id;
          }
        }
        return screenid;
      },
      
      findNextScreen: function() {
        var self=this, nextNodes=[];
        if(this.screenid && this.graph) {
          if(!_.isEmpty(this.graph.edges)){
            nextNodes =  this.graph.edges.filter(function(edge){
              return (self.screenid == edge.source);
            });
            //if(node.length) { nextid = node[0].target; }
          }
        }
        return nextNodes.map(function(node){
            return node.target;
        });
      },
    
      findPreScreen: function() {
        var preid= null, self=this;
        if(this.screenid && this.graph) {
          if(!_.isEmpty(this.graph.edges)) {
            var node =  this.graph.edges.find(function(edge){
              if(self.screenid == edge.target) return true;
              return false;
            });
            if(node) { preid = node.source; }
          }
        }
        return preid;
      },
        
      drawWithoutScreenId: function() {
        var self = this;
        this.screenCtrl.getLastestID(this.URL.last_screen)
            .done(function(screen){
              if(screen && screen.id) {
                self.screenid = screen.id;
                self.drawWithScreenId();
              } else {
                self.screenCtrl.getNewID(self.URL.new_screen)
                .done(function(id){
                   self.screenid = id;
                   self.drawWithScreenId();
                 })
                .fail(function(err){
                   console.log(err);
                 });   
              }
            })
            .fail(function(err) {
              console.log(err);
            });
        return this;
      },
    
      drawWithScreenId: function() {
        if(!this.mainView) {
          this.mainView = new BoardManagerView(
            {el: $('<contents/>').appendTo(this.$el), parent: this});
          this.mainView.render();
        }
        
        //update screen label in header
        framework.mediator.trigger('headerview:screenid', this.screenid); 
        
        return this;
      },
          
      shiftToScreen: function (id){
        /*
        if(!_.isEmpty(options)) {
          this.context = _.clone(options);
        }
        */        
        if(id && id != this.screenid) {
          this.mainView.destroy();
          this.mainView= null;
          this.screenid = id;
        }
        this.render();
      },
    
      newScreen: function(){
        var self = this;
        
        this.screenCtrl.getNewID(this.URL.new_screen)
         .done(function(id){
          //save the current image
          self.updateImage();
          //clear the current screen 
          if(self.mainView) {
             self.mainView.destroy();
             self.mainView = null;
          }
           //draw new screen
           self.screenid = id;
           self.drawWithScreenId();
         })
         .fail(function(err){
           console.log("Failed  to add Screen !");
         });
      },
      
      downloadImage: function() {
        if(this.mainView){
          var chart_el  = this.mainView.$el.find('charts');
          var imagename = this.mainView.model.get('id');
          this.screenCtrl.SaveImg2LocalStorage(chart_el, imagename);
        }
      }, //imageMe end
    
      updateImage: function() {
        var self = this;
        if(this.mainView){
          var chart_el  = this.mainView.$el.find('charts');
          var imagename = app.session.user.get('id')+'.' + this.mainView.model.get('id');
          this.mainView.model.set('imgurl', imagename);//upate db
          this.screenCtrl.captureElement(chart_el, 300, 200)
            .done(function (img){                                                        
             self.screenCtrl.saveImg(self.URL.snapshot_root + imagename, img);
          }).fail(function(err){
            //
          });
        }//if end
      },
      
      updateControl: function () {
        if(this.mainView) {
          var $preButton = this.$el.find('button.event-pre-screen');
          if(this.findPreScreen()) {
            $preButton.removeAttr('disabled');    
          } else {
            $preButton.prop("disabled", true);
          }
          
          var $firstButton = this.$el.find('button.event-first-screen');
          var firstScreen = this.findFirstScreen();
          if(firstScreen && this.screenid && firstScreen != this.screenid){
            $firstButton.removeAttr('disabled');
          } else {
            $firstButton.prop("disabled", true);
          }
          
          var $nextButton = this.$el.find('button.event-next-screen');
          var nextScreens = this.findNextScreen();
          if(nextScreens.length>0 ){
            $nextButton.removeAttr('disabled');
          } else {
            $nextButton.prop("disabled", true);
          }
        }
      },
      
      shiftToPreScreen: function() {
         if(this.mainView && this.mainView.preScreen) {
           this.shiftToScreen(this.mainView.preScreen);
         }
      },
    
      shiftToNextScreen: function(evt) {
        var self = this,
            nextScreens = this.findNextScreen();
        
        if(nextScreens.length > 1) {
            require(['view/SelectionView'], function(SelectionView) {
                (new SelectionView()).show(nextScreens, evt.originalEvent)
                .done(function(selected){
                    //suppose that this context have been updated 
                    self.shiftToScreen(selected);
                });
            });
        } else if(nextScreens.length == 1) {
            this.shiftToScreen(nextScreens[0]);
        } else {
            //skip
        }
      },
      
      shiftToFirstScreen: function() {
        var firstScreen = this.findFirstScreen();
         if(this.mainView && this.screenid && firstScreen && firstScreen !== this.screenid) {
           this.shiftToScreen(firstScreen);
         }
      },
      
      bookmarkMe: function() {
        var self = this;
        this.screenCtrl.cloneMe(
          this.screenid,
          this.URL.clone_screen
        ).done(function(imagename){
          self.screenCtrl.captureElement(self.mainView.$el.find('charts'), 300, 200)
            .done(function (img){                                                        
             self.screenCtrl.saveImg(self.URL.snapshot_root + imagename, img);
          }).fail(function(err){
            //
          });
        });
      },
    
      showBreadcrumb: function($target) {
        if(!this.status) { //not a screen of the current tool
          return this;
        }

         var self = this;
         var toolid  = this.status.get('tool').id;
         if(this.graph && toolid) {
             require(['util/breadcrumb/breadcrumbView'], function(breadcrumbView){
                 if(breadcrumbView.dialog && breadcrumbView.dialog.opened) {
                     console.log('skip reopen a new dialog!');
                 } else {
                     breadcrumbView.$el.empty();
                     breadcrumbView.render(self.graph, toolid, self.screenid);
                 }
             });
         }
      },
     
      //rewrite remove to keep root element
      remove: function() {
        if (this.sidebarView) {
          this.sidebarView.remove();
        }
        if(this.mainView){
          this.mainView.destroy();
        }
        this.$el.remove();
        this.stopListening();
        return this;
      },
      
    });
  return ScreenView;
});
