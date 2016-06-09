/**
 * Create BoardManagerView main function
 *
 * @class BoardManagerView
 * @param {type} app app.js
 * @param {type} BoardManagerModel BoardManagerModel class
 * @param {type} BoardCollectionView BoardCollectionView class
 * @param {type} DataMapingPanel DataMapingPanel class
 * @param {type} ControlPanel ControlPanel class
 * @param {type} ContextMenuModel ContextMenuModel class
 * @param {type} util library Undo.js
 * @param {type} util library Command.js
 * @returns {BoardManagerView}
 */

define(['js/app',
        'model/BoardManagerModel',
        'view/BoardCollectionView',
        'view/ControlPanel',
        'view/DataMappingPanel',
        'model/ContextMenuModel',
        'lib/gridster/jquery.gridster.with-extras',
        'lib/contextMenu/jquery.contextMenu',
        'css!lib/gridster/jquery.gridster',
        'css!lib/contextMenu/jquery.contextMenu'
       ],
       function ( app,
                  BoardManagerModel,
                  BoardCollectionView,
                  ControlPanel, 
                  DataMappingPanel,
                  ContextMenuModel
                ) {
  /**
     * Constructor create BoardManagerView
     * @method BoardManagerView
     * @memberOf BoardManagerView
    */
  var MyClass = Backbone.View.extend({
     
      initialize: function (options) {
         _.extend(this, _.pick(options, "parent"));// to use this.screenid if existed
         _.bindAll(this, 'render', 'drawMe', 'addBoard');
       
        this.$grid_ul = this.$el.append("<charts class='gridster'><ul></ul></charts>")
                    .find('.gridster > ul');
        this.boardsView = new BoardCollectionView({el: this.$grid_ul, parent: this });
        
        this.listenTo(framework.mediator, 'board:delete', this.removeBoard);
        this.listenTo(framework.mediator, 'board:active', this.activeBoard);
        this.listenTo(framework.mediator, 'boardmanager:undoredo', this.undoredoUpdate);
        this.listenTo(framework.mediator, 'boardmanager:fit2window', this.fit2window);
       
        this.clicked = {x: 0, y: 0};
        
        //context menu
        this.contextMenuModel = (new ContextMenuModel()).config();
        this.$el.contextMenu({
          selector: 'charts.gridster',
          callback: this.addBoard,
          trigger: 'none',
          zIndex: 100000, //show context menu on the top
          build: function($container, e) {
            e.preventDefault();
            e.stopPropagation();
            return $container.data('contextData');
          }
        });
        
        this.model = new BoardManagerModel(
          {user: app.session.user.get('userId')},
          {screenid: this.parent.screenid });
          
        this.model.on('change', function(){
          if(this.model.hasChanged('id') && this.parent){
            this.parent.screenid = this.model.get('id');
          }
        }, this);
        
        //screen shift control buttons
        this.nextScreen = this.parent.findNextScreen();
        this.preScreen = this.parent.findPreScreen();
        
        //common panels
        this.designPanel = new ControlPanel();
        this.dataMappingPanel = new DataMappingPanel();
      },
      
      events: {
        "contextmenu charts.gridster": 'onRightClick',
        "click charts.gridster:not('.chart'), charts.gridster:not('.non-modal-dialog')" : 'unactivateBoard'
      },
      
      onRightClick: function(e){
        var self = this;
        if( e.button == 2 ) {//right click
          e.preventDefault();
          self.contextMenuModel.getDatalistOfCharts().done(function(menu){
            var $me = self.$el.find('charts.gridster');
            $me.data('contextData', menu);
            $me.contextMenu({x: e.pageX, y: e.pageY});
            self.clicked.x = e.pageX;//e.offsetX;
            self.clicked.y = e.pageY; //e.offsetY;
          });
        }
      },
    
    // Remove board function
    removeBoard: function (view) {
      var self = this,
          id= view.model.get('id');
      this.gridster.remove_widget(
        this.$el.find('#'+id),
        function(){
          self.model.set('cells', self.gridster.serialize());
        }
      );//remove_widget end
      self.boardsView.removeBoard(view);
    },   
    
    unactivateBoard: function(event) {
      //event.stopPropagation();//add this line will invalid multiple selection
      this.$el.find(".gridster .board").each(function (index, domEle) {
          $(domEle).removeClass("selected");
        });
    },
    
    activeBoard: function (view) {
      var isSelected = view.$el.hasClass("selected");
      if (!isSelected) {
        this.$el.find(".gridster .board").each(function (index, domEle) {
          $(domEle).removeClass("selected");
        });
        view.$el.addClass("selected");
      }
    },
    
    // Add new chart function
    addBoard: function (key, options) {
      var self = this;

      var sepIndex = key.lastIndexOf('/');
      var vtname = key.substring(sepIndex + 1);
      var vttype = key.substring(0, sepIndex);
      
      var clickedBoard = this.clickedPosition();
      // create BoardModel to get new id
      this.boardsView.createBoardModel({vtname: vtname, vttype: vttype})
        .done(function (mymodel) {
          self.gridster.add_widget.apply(self.gridster,
            ["<li id=" + mymodel.get('id') + "></li>",
                1, // block.size_x
                1,
                clickedBoard.col, //block.col
                clickedBoard.row
              ]);
          self.model.set('cells', self.gridster.serialize());
          
          //draw chart
          self.boardsView.addBoardView(mymodel.get('id'));
        });
      },
      
      clickedPosition: function(){
        var self = this;
        var rtn = {col:1, row: 1}, cord;
        $.each(self.gridster.faux_grid, function(i, board){
          cord = board.coords;
          if(cord.x1 < self.clicked.x && cord.x2 > self.clicked.x &&
             cord.y1 < self.clicked.y && cord.y2 > self.clicked.y)
          {
            rtn.col = board.data.col;
            rtn.row = board.data.row ;
            return false;
          }
        });
        return  rtn;
      },
      
      render: function(){
        
        this.parent.updateControl();
        
        this.model.syncMe()
          .done(this.drawMe)
          .fail(function(err){
            console.log(err);
          });
        //only render at the first time?
      },
    
      // Render BoardManagerView
      drawMe: function () { //it is time-consuming to redraw each time
        var self = this;
        var cells =  this.model.get('cells');
    
        if(!(cells instanceof Object)){
          cells = JSON.parse(cells);
        }
    
        self.defineLayout();
        
        _.each(cells, function (block) { //each block take a board data
            self.gridster.add_widget.apply(self.gridster,
              ["<li id=" + block.id + "></li>",
                block.size_x,
                block.size_y,
                block.col,
                block.row ]);
    
            //note the BoardModel data have exited in server
            self.boardsView.addBoardView(block.id);
        });
    
        self.defineResponsive();
        //watching this model
        //framework.undoer.register(this.model);
        //framework.undoer.startTracking();
        //framework.undoer.removeUndoType("change");
    
        return self;
      },
      
      // Define layout function
      defineLayout: function () {
        var self = this;
        var widgetMargin = this.model.get('margin'),
            height =  this.$grid_ul.parent().height();
        
        var rows = this.model.get('maxRows');
        var cellHeight= height/rows - widgetMargin -widgetMargin/rows;
        
        if (this.gridster) {
          this.gridster.destroy();
          this.$grid_ul.empty();
        }
        
        //define instance variable of gridster
        this.gridster = this.$grid_ul.gridster({
          namespace: 'charts.gridster',
          max_cols: this.model.get('maxColumns'),
          max_rows: this.model.get('maxRows'),
          widget_base_dimensions: ['auto', cellHeight],
          autogenerate_stylesheet: true,//responsive design
          widget_margins: [widgetMargin, widgetMargin],
          avoid_overlapped_widgets: true,
          helper: 'clone',
          resize: {
            enabled: true,
            stop: function (e, ui, $widget) {
              self.boardsView.resize(+$($widget).attr('id')//, 
                  //this.resize_coords.data.width,
                  //this.resize_coords.data.height
                );
              self.model.set('cells', self.gridster.serialize());
            }
          },
          draggable: {
            stop: function (e, ui, $widget) {
              self.model.set('cells', self.gridster.serialize());
            }
          },
          
          serialize_params: function ($w, wgd) {
            var widget = (typeof wgd === 'undefined') ? $($w).data() : wgd;
                return {
                    id:     $($w).attr('id'),
                    col:    widget.col,
                    row:    widget.row,
                    size_x: widget.size_x,
                    size_y: widget.size_y,
                };
          }//function end
        }).data('gridster');
      },
        
      defineResponsive: function() {
        var self = this;
        
        //override resizing functionality for responsive design
        self.$grid_ul.data('_container_height_',  self.gridster.$wrapper.height());
        var old_update_widgets_dimensions = self.gridster.update_widgets_dimensions;
        self.gridster.update_widgets_dimensions = function() {
          var oldHeight  = self.$grid_ul.data('_container_height_'), 
              ratio = self.gridster.$wrapper.height() /oldHeight;
          var newBaseHeight = self.gridster.options.widget_base_dimensions[1] * ratio + 
                self.gridster.options.widget_margins[1]*(ratio-1)*(1+1/self.gridster.rows);
          self.gridster.resize_widget_dimensions({
              namespace: 'charts.gridster',
              widget_base_dimensions: [self.gridster.options.widget_base_dimensions[0], Math.round(newBaseHeight)],
              min_rows: self.gridster.get_highest_occupied_cell().row,
              min_cols: self.gridster.get_highest_occupied_cell().col
           });
          old_update_widgets_dimensions.call(self.gridster);
          self.$grid_ul.data('_container_height_',  self.gridster.$wrapper.height());
        };
        
        var old_update_widget_dimensions = self.gridster.update_widget_dimensions;
        self.gridster.update_widget_dimensions = function($widget, wgd){
          old_update_widget_dimensions.call(self.gridster, $widget, wgd);
          self.boardsView.resize(+$($widget).attr('id'), 
                $widget.data('coords').coords.width,
                $widget.data('coords').coords.height);
        };
      },
      
      fit2window: function(index) {
          var self = this,
              $renderedArea = this.$grid_ul;
          
          var oldHeight  = $renderedArea.get(0).scrollHeight, 
              newHeight  = $renderedArea.parent().height();
              ratio = newHeight/oldHeight;
              
          var newCellHeight = self.gridster.options.widget_base_dimensions[1] * ratio + 
                self.gridster.options.widget_margins[1]*(ratio-1)*(1+1/self.gridster.rows);
          
          self.gridster.resize_widget_dimensions({
               namespace: 'charts.gridster',
               widget_base_dimensions: [self.gridster.options.widget_base_dimensions[0], newCellHeight],
               min_rows: self.gridster.get_highest_occupied_cell().row,
               min_cols: self.gridster.get_highest_occupied_cell().col
          });
          
          $renderedArea.css('height', newHeight);
          
          /*if(index <3) {
            var $parent = $renderedArea.parent();
            if( ($parent.get(0).scrollHeight - parseInt($parent.css('padding-top')) - parseInt($parent.css('padding-bottom')) ) != $parent.height() || 
                ($parent.get(0).scrollWidth -  parseInt($parent.css('padding-right')) - parseInt($parent.css('padding-left')) ) != $parent.width()) {
                self.fit2window(index+1);
            }
          }*/
      },
      
      destroy: function () {
        if(this.gridster) {
          this.gridster.destroy();
          this.gridster= null;
        }
        
        this.boardsView.destroy();
        this.designPanel.remove();
        this.dataMappingPanel.remove();
    
        this.remove();
      },
      
      undoredoUpdate: function() {
        if(this.model.changedAttributes()){
          //this.render();
        }
      }
    
    });//myclass define end

    return MyClass;
  });
