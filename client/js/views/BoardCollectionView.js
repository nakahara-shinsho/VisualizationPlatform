define(['model/BoardCollection','view/BoardViewExt'], function (BoardCollection, BoardView) {

  var myclass = Backbone.View.extend({
    
    initialize: function (options) {
      
      _.extend(this, _.pick(options, "parent"));// to use this.screenid if existed
      
      this.collection = new BoardCollection();
      this._Views = {};
      this.linkFromChartId = null; // initial value
	},
    
    //first create model, then draw  board
    createBoardModel: function(opts) {
      return this.collection.newModel(opts);
    },
    
    //the dom elements of board have been deleted with gridster manager
    removeBoard: function(view){
      var self = this, 
          id = view.model.get('id');
      
      //delete view in viewlist
      delete self._Views[id];

      //delete all linking message in the other view
      for(var otherview in self._Views) {
        if(id in otherview.linkViews) {
          delete otherview.linkViews[id];
        }
      }

      //delete model message in database
      this.collection.removeModel(view.model)
        .fail(function(err){
          console.log(err);
        });
    },
    
    addBoardView: function(id) {
      var self = this;
	    //the board_element have been add with gridster manager
      var $board_element = this.$el.find("li[id='" + id + "']");
	    if($board_element && !self._Views[id]) {
	        this.collection.lookupModel(id)
	        .done( function (model) {
              var boardView = new BoardView(
                {model: model, el: $("<div class='board'/>"), parent: self });
            
              /*$board_element.append(boardView.render(
                $board_element.width(), $board_element.height()).el);
              */
              $board_element.append(boardView.$el);
              boardView.render();
              
              // cache the view for reference later
              self._Views[id] = boardView;
              
	        });
          
	     }
	  },
    
    resize: function(id, width, height) {
      if(id && this._Views[id]) {
        this._Views[id].resize(width, height);
      }
    },
    
   
    destroy: function() {
      var self = this;
      var $boards = this.$el.find("li[id]");
      _.each($boards, function(board) {
        var id = $(board).attr('id');
        var view = self._Views[id];
        if(view) {
            view.remove();
        }
      });
      this.remove();
    }
  });
  
  return myclass;

});