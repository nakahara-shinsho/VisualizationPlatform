define([
  'view/ColorManagerView',
  'text!templates/data_mapping_panel.html',
  'util/nonmodal/NonModalDialog'
], function (ColorManagerView, dataMappingTpl, NonModalDialog) {
  /**
   * Mapping from chart to data of chart
   * @typedef DataMappingPanel
   * @type {DataMappingPanel}
   * @constructor
   */
  var DataMappingPanel = NonModalDialog.extend({
    title: 'Chart Mapping Panel',
    className: 'data-mapping-panel', //the class for new create $el
    width: 500,
    /**
     * Constructor function of DataMappingPanel class
     * @param {type} options - Input data of constructor function
     */
    initialize: function (options) {
      NonModalDialog.prototype.initialize.apply(this);
      this.$docker = $(document.body);
      this.listenTo(framework.mediator, 'board:datamapping', this.toogle);
      this.listenTo(framework.mediator, 'board:active', this.switchData);
    },

    dataMapped: function() {
      var self=this, chartprops = {};
      var $dimensions = this.$('.dimensions .dimension');
      $dimensions.each( function(index, dimension){ //for each datamapper prop
        var key = dimension.getAttribute('name');
        if($(dimension).find('span.dim-type').html().endsWith('Array')) { //get data mapping for Array
          var colNames = _.map($(dimension).find('.container .col-name').toArray(), function (elm) {
              return $(elm).html();
            });
          chartprops[key] = colNames;
        } else {  //get data mapping for non-Array
          var $col = $(dimension).find('.container .col-name');
          if($col.length) {
            chartprops[key] = $(dimension).find('.container .col-name').html();
          } else {
            chartprops[key] ='';
          }
        }
      });

      if(this.receiver)  this.receiver.manualMapping(chartprops);
    },

    /**
     * Bind event for column drag
     */
    bindEventsOnRight: function () {
      var self = this;
      // drag column tag from inside dimension container to outside of dimension container
      this.$('.dimensions .column-name').off('dragend');
      this.$('.dimensions .column-name').on('dragend', function (ev) {
        ev.preventDefault();
        $(this).remove();//delete it
        self.dataMapped();//upate chart
      });
    },

    /**
     * Perform
     * @param {jQueryEvent} ev - Event object of natural drag and drop event
     * @param {jQueryObject} container - Container htmltag jQueryObject
     */
    onColumnDroped: function (ev, container) {
      var self = this,
          colType = ev.originalEvent.dataTransfer.getData('type'),
          colName = ev.originalEvent.dataTransfer.getData('name'),
          dimType = container.parent().find('.dim-type').html();

      // check existing of column in dimensions area
      var colNames = _.map(container.find('.col-name').toArray(), function (elm) {
        return $(elm).html();
      });

      if (colNames.indexOf(colName) !== -1) {
        alert('Column name ' + colName + ' have already existed');
        return;
      }

      if (dimType.endsWith('Array') && dimType.startsWith(colType) ) {
        container.append(ev.originalEvent.dataTransfer.getData('html'));
      } else {
        if (colType !== dimType) {
          alert('Column type ' + colType + ' is different with dimension type ' + dimType);
          return;
        } else {
          container.html(ev.originalEvent.dataTransfer.getData('html'));
        }
      }
      //bind events
      this.bindEventsOnRight();
      
      //collect data and update chart
      this.dataMapped();
    },

    /**
     * By events for drag and drop mapping between columns and dimensions
     */
    bindEventsOnLeft: function () {
      var self = this;
      // FROM ".columns .column-name"
      this.$('.columns .column-name').on('dragstart', function (ev) {
        self.dragged = this;
        ev.originalEvent.dataTransfer.setData('html', ev.target.outerHTML);
        var type = $(ev.target).find('.col-type').html();
        ev.originalEvent.dataTransfer.setData('type', type);
        var name = $(ev.target).find('.col-name').html();
        ev.originalEvent.dataTransfer.setData('name', name);
      });
      
      this.$('.columns').on('dragover', function (ev) {
        ev.preventDefault();
      });

      // dragfrop for container ".dimensions .container"
      this.$('.dimensions .container').on('drop', function (ev) {
        ev.preventDefault();
        $(this).removeClass('place-holder');
        self.onColumnDroped(ev, $(this));
      });
      // dragover for container of dimension area
      this.$('.dimensions .container').on('dragover', function (ev) {
        ev.preventDefault();
        $(this).addClass('place-holder');
      });
      // dragleave for container of dimension area
      this.$('.dimensions .container').on('dragleave', function (ev) {//ok
        ev.preventDefault();
        $(this).removeClass('place-holder');
      });
      
      //bin events on the reverse direction (right-->left)
      this.bindEventsOnRight();
    },

    onSwitchAnchorCliked: function(evt) {
      evt.stopPropagation();
      if(this.$docker.has("#middle").length>0){ //to be anchored
        this.$el.css({'position': '',
                      flex:'0 1 auto',
                      order: 3
                     });
        this.$docker = $(document.body).find('#middle');
        this.$el.detach().appendTo(this.$docker);
      }else {
        this.$el.css({'position': 'absolute',
                      flex:'',
                      order: ''});
        this.$docker = $(document.body);
        this.$el.detach().appendTo(this.$docker);
        this.positionMe();
      }
    },
    /**
     * Posite panel at start position
     */
     positionMe: function() {
      if(this.width){
        this.$el.width(this.width);
      }
      var $loc_point = this.$docker.find('contents');
      this.$el.css('top', $loc_point.offset().top);
      this.$el.css('left',$loc_point.offset().left + $loc_point.width() - this.$el.width());
      this.$el.height($loc_point.innerHeight());
    },
    
    switchData: function(view) {
      if (this.isOpened()) {
          this.show(view);
          this.curView = view;
      }
    },
    
    toogle: function (view) {
      if (!this.isOpened()) {
        this.show(view);
        this.curView = view;
      } else {
        if (this.curView === view) {
          this.close(view);
          this.curView = null;
        } else {
          this.show(view);
          this.curView = view;
        }
      }
      if (this.curView) {
        //this.curView.activeMe();
      }
    },
    
    onOpen: function(view) {
      var dataManager = view.chartctrl.dataManager();
      this.$el.detach().appendTo(this.$docker);
      
      this.$el.find('.dialog-contents').empty().html(_.template(dataMappingTpl)({
        //_data_: dataManager.getData(),
        _dataTypes_: dataManager.getDataType(),
        _chart_:dataManager.getMapperProps()
      }));
      
      this._colorManagerView = new ColorManagerView();
      this.$el.find('.color-mapping').append(this._colorManagerView.render(view.chartctrl.colorManager()));
      this.receiver = view.chartctrl; //receive event
      this.bindEventsOnLeft();
    },
    
    onClose: function() {
        if(this._colorManagerView) {
            this._colorManagerView.close();
        }
    }
    
  });

  return DataMappingPanel;

});

