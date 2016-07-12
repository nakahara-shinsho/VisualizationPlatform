define(['view/BoardView'], function (BoardView) {
  var BoardViewExt = BoardView.extend({
      initialize: function() {
        
        BoardView.prototype.initialize.apply(this, arguments);
        
        //chart linking
        //this.listenTo(this.chartctrl,'change:_linkage_', this.linkage); //this will trigger general change event?
        //this.chartmodel.bind('change:_simple_link_', this.simpleLink, this);
        //this.chartmodel.bind('change:_deep_link_', this.deepLink, this);
        //this.chartmodel.bind('change:_deep_update_', this.deepUpdate, this);
        this.listenTo(this.chartctrl, 'change:_data_link_', this.onLinkingEvent);
      },
    
    //update linked charts
    onLinkingEvent: function() { 
      var self = this,
          params = arguments;
      if( _.isEmpty(this.linkViews)) return;
      
      Object.keys(this.linkViews).forEach(function(id){
           var view = self.parent._Views[id],
               dataManager = view.chartctrl.dataManager();
           dataManager.linkages.apply(dataManager, params);
      });
    },
   
    //deepUpdate: renew chart with server query
    deepUpdate: function (options) {
        var self = this;
      if (this.chartctrl.widget.renew && 
           (!this.isDeepUpdating || options._remove_)) {//request only if chart can process
        this.isDeepUpdating = true;
        
        //get new data and process it
        this.chartctrl.getData(this.model.get('vtname'), options)
          .done(function (myChartModel) {
            console.log('Hi, i recevied new data!');
            self.isDeepUpdating = false;
            //is a renew function is necessary in chart?
            var $chart_el = self.$el.find('.chart');
            var renderd_dom = myChartModel.widget.renew(options._remove_);
            if(!!renderd_dom) {
              $chart_el.append(renderd_dom);
            }
          });
      } /*else {
        console.log('Hi, i skiped renewing !');
      }*/
    },
    
    showVirtualTables: function() {
      var options = {type: this.model.get('vttype').split('/')[0]};
      
      $.ajax({type: 'get', data: options, cache: false, url: 'api/vts'})
      .done(function(list){
        console.log(list);
        //show list
      })
      .fail(function(){
        console.log('failed to get virtual list');
      });
    }
    
    
  }); //BoardViewExt defination end
  
  return BoardViewExt;
});