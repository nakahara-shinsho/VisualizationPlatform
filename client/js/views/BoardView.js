define([
  "js/app", 
  'text!templates/board.html',
  'ctrl/ChartCtrlExt',
  'util/getFile',
  'util/unic/Wrapper',
  'model/ContextMenuModel',
  'lib/bootstrap-multiselect' //show the dropdown menu
], function (app, boardTpl,  ChartCtrl, getFile, Wrapper, ContextMenuModel) {
  var BoardView = Backbone.View.extend({

    template: _.template(boardTpl),

    initialize: function (options) {
      var self = this;
      
      _.bindAll(this, 'render', 'switchData');
        
      _.extend(this, _.pick(options, "parent"));// to use this.screenid if existed
         
      this.$el.html( this.template());
      
      this.chartctrl  = new ChartCtrl(this.model);
      
      this.listenTo(this.chartctrl, 'change:_save_model_', function() {
        this.model.save(null, {patch: true});
      });
      
      this.listenTo(this.chartctrl, 'change:_show_ctrl_', function(key, position, manager) {
        var $ctrl = manager.getControl(key);
        if($ctrl.length > 0 ) {
          Wrapper.show($ctrl, position, manager);
        }
      });
      
      this.listenTo(this.chartctrl, 'loading:start', function() {
        self.chartctrl.loading = true;
        self.$el.find('.loading').css("display", "block"); 
      });
      this.listenTo(this.chartctrl, 'loading:end', function() {
         self.chartctrl.loading = false;
         self.$el.find('.loading').css("display", "none");
      });

      //caption update is outside chart
      this.model.bind('change:caption', function () {
        self.setCaption();
      }, this);
      
      //have not implemented -- 2015/11/9
      //this.listenTo(framework.mediator, 'board:undo', this.undoUpdate.bind(this));
      //this.listenTo(framework.mediator, 'board:redo', this.redoUpdate.bind(this));
      this.listenTo(framework.mediator, 'board:toggle-caption', this.toggleCaption);
      this.listenTo(framework.mediator, 'board:clear-filter', this.clearFilter);
      
      this.linkViews = {};//(id: view) pairs
      
      this.$el.find('.chart-buttons select').multiselect( {
        numberDisplayed: 1,
        buttonWidth: '120px',
        click: function(event, ui){
          event.stopPropagation();
        },
        onChange: function(option, checked){
          var id = option.val();
          if (checked){
           self.linkViews[id] = option.html();//add the view to linking list
          } else {
           if(self.linkViews[id]) delete self.linkViews[id]; //delete view from linking list
          }
          self.model.set('linkids', _.keys(self.linkViews));
        },
        onDropdownShow: self.updateLinkMenu.bind(self)
      });
      
      this.contextMenuModel = new ContextMenuModel();
      this.$el.contextMenu({
          selector: '.chart',
          trigger: 'none',
          callback: this.switchData,
          build: function($container, e) {
            e.preventDefault();
            e.stopPropagation();
            return $container.data('local_context');
          }
      });
    },
    
    events: {
      'click button.event-vt': 'showVirtualTables',
      'click button.event-delete': 'onDeleteMe',
      'click button.event-design-panel': 'toggleDesignPanel',
      'click button.event-link-panel': 'toggleControlPanel',
      'click button.event-toggle-mode': 'toggleMode',
      'click button.event-zoom': 'onZoomMe',
      'click button.event-image': 'onImagingMe',
      'click button.event-data-mapping-panel': 'toggleDataMappingPanel',
      'click button.event-clear-filter': 'clearFilter',
      'dblclick .caption > p' : 'showCaptionControl',
      'click .chart, .caption': 'activeMe',
      'click select': 'updateLinkMenu',
      "contextmenu": 'onRightClick',
    },
    
    onRightClick: function(e){
        var self = this;
        
        if( e.button == 2 && self.$el.has(e.target).length>0 ) {//right click
          e.preventDefault();
          e.stopPropagation();
         
          self.contextMenuModel.getDatalistOfChart(this.model.get('vttype')).done(function(menu){
            var $me = self.$el.find('.chart');
            if(!_.isEmpty(menu.items)) {
              $me.data('local_context', menu);
              $me.trigger(
                $.Event('contextmenu', {pageX: e.pageX, pageY: e.pageY})
              );
            }
          });
        }
    },
    
    switchData: function(key, options) {

      var self = this, grandParent = this.parent.parent;

      this.chartctrl.dataManager().clearAll();
      this.chartctrl.colorManager().clearAll();
      this.model.set({'vtname': key}, {silent: true});
      
      this.chartctrl.dataManager().getDataFromServer(key, grandParent.context)
      .done( function () {
         self.setCaption();
         var $chart = self.$el.find('.chart'),
             width  = $chart.width(),
             height = $chart.height(),
             renderd_dom = self.chartctrl.render(width, height);
         if(!!renderd_dom) {
           $chart.empty().append(renderd_dom);
           if($(renderd_dom).is('svg') && $chart.find('svg').length==1) {
             self.resize_svg(renderd_dom, width, height);
           }
         }
         self.updateLinkMenu();//
         self.updateModeIcon();//
         
         self.activeMe($.Event( "switch_data" ));
      })
      .fail(function(e) {
        console.log(e);
      });//done end
      
      return this;
    },
    
    resize: function (containerWidth, containerHeight){
       
       var $chart = this.$el.find(".chart"),
            width = $chart.width(),
            height= $chart.height();
       
       if(containerWidth && containerHeight) {
           width  = containerWidth;
           height = containerHeight - this.$el.find('.caption').height();
       }
       
       if( !this.chartctrl.resize(width, height)) {
          /*var $first= this.$el.find('.chart > svg');
          if($first.length >0) {
            this.resize_svg($first[0], width, height);
          } else {
            //no way to resize
          }*/
          var renderd_dom = this.chartctrl.render(width, height);
          $chart.empty().append(renderd_dom);
          if($(renderd_dom).is('svg') && $chart.find('svg').length==1) {
             this.resize_svg(renderd_dom, width, height);
          }
       }
       
        //update size in chart options
       $.extend(this.chartctrl.options, {width: width, height: height});
    },
    
    onZoomMe: function (evt) {
      var self = this;
      var $cell = this.$el.parents('li'),
          $ul = $cell.parents('ul'),
          $gridster = $ul.parents('charts.gridster'),
          $contents = $gridster.parents('contents');
      // Find zoom button to set class
      var $btnZoom = this.$el.find('.event-zoom i.fa'); //the zoom button
      this.$el.removeClass("selected");

      if ($btnZoom.hasClass('fa-expand')) { //expended: to restore
        $btnZoom.removeClass('fa-expand').addClass('fa-compress');

        // Save old data for restore state after expanding
        var org_position = $cell.position(); //position of 'li' element
        $cell.attr({
          'data-width':  $cell.width(),
          'data-height': $cell.height(),
          'data-left': org_position.left,
          'data-top': org_position.top
        });
        // Get scroll if existed
        var top = $contents.scrollTop() + 3,
            left = 3 - parseInt($ul.css('margin-left')),
            width = $gridster.width()-6,
            height = $gridster.height()-6;
        // Hidden scrollbar after expanding
        $gridster.parent().css('overflow', 'hidden');
        // Set new style for expanding
        $cell.css({
          'position': 'absolute',
          'top':top + 'px',
          'left': left + 'px',
          'width': width + 'px',
          'height': height + 'px',
          'z-index': '99'
        });
        self.resize(width, height);
                
      } else { //normal: to enlarge
        $btnZoom.removeClass('fa-compress').addClass('fa-expand');
        // Restore style before expanding
        $cell.css({'position': 'absolute',
          'top': $cell.attr('data-top') + 'px',
          'left': $cell.attr('data-left') + 'px',
          'width': $cell.attr('data-width') + 'px',
          'height': $cell.attr('data-height') + 'px',
          'z-index': '0'});
        
        // Restore scrollbar
        $gridster.parent().css('overflow', 'auto');
        
        // don't save the size to database
        self.resize(parseInt($cell.attr('data-width')), parseInt($cell.attr('data-height'))); 
      } //if-else-end
      
      self.activeMe(evt);
    },
    
    // Active chart when click mouse on chart or click tab of this chart in control panel
    activeMe: function (evt) {
      if(evt && (evt instanceof $.Event)){
        evt.stopPropagation(); //stop propagation to parent element 
        framework.mediator.trigger('board:active', this);//to udate control panel
      }
    },
   
    onImagingMe: function (evt) {
      var self = this;
      var chart_el = self.$el.find('.chart');
      getFile.convertSVGToCanvas(chart_el);
      html2canvas(self.$el, {
        onrendered: function (canvas) {
          var img = canvas.toDataURL("image/jpeg");
          getFile.download(img, self.model.id + ".jpg", "image/jpeg");
          // Remove canvas and display SVG chart after capture current chart
          getFile.revertSVGFromCanvas(chart_el);
        } //onrendered end
      });
      this.activeMe(evt);
    },
    
    //Delete chart on window screen
    onDeleteMe: function (ev) {
      //tigger delete board event
      var del = confirm("Are you sure for deleting this chart?");
      if (del === true) {
            this.stopListening();//stop listening to all events
            //triggier event to gridster for deleting dom
            framework.mediator.trigger('board:delete', this);
      }
    },
    
    //update the menu each time of access
    updateLinkMenu: function() {
      var self = this;
      var currentViews = self.parent._Views;
      var currentSelects = self.model.get('linkids');
      var $dropdown = self.$el.find('select');
      
      if(!currentSelects){
        currentSelects = [];
      } else if(!Array.isArray(currentSelects)){
        currentSelects = JSON.parse(currentSelects);
      }
      
      var optionItems = d3.select($dropdown.get(0)).selectAll('option')
           .data(_.values(_.omit(currentViews, self.model.id) ), function(view){return view.cid;});
           
      optionItems.enter()
        .append('option')
      .attr('value', function(d){return d.model.id;})
      .property('selected', function(d){
         var key=d.model.id+'',
             ret = currentSelects.includes(key);
         if(ret) {
           self.linkViews[key] = d.cid;
         } else {
           ret = null;
         }
         return ret;
      });
                    
      optionItems.text(function(d){return d.getCaption();});
            
      optionItems.exit().remove();
      
      $dropdown.multiselect('rebuild');
    }, 
    
    resize_svg: function(svg_dom, width, height) {
      var bbox = svg_dom.getBBox();
      if(bbox) {
         svg_dom.setAttribute("viewBox",  [bbox.x, bbox.y, bbox.width, bbox.height]);
      }
      if(width) {
        $(svg_dom).attr('width', width);
      }
      if(height) {
        $(svg_dom).attr('height',height);
      }
      /*
      //set 'svg text' as no scale element
      $(svg_dom).find('text').each(function(){
        $(this).addClass('class','no-scale');
      });      
      noScaleSVGElements();
      */
      if(!svg_dom.hasAttribute("preserveAspectRatio")){
        svg_dom.setAttribute("preserveAspectRatio", 'none');
      }
    },
    
    getCaption: function() {
      var self = this,
          caption_text = self.model.get('caption');
      if(_.isEmpty(caption_text)) {
        if(self.chartctrl.caption) {
          caption_text = self.chartctrl.caption;
        } else {
          caption_text = self.model.get('vttype') +' (' +self.model.get('vtname') +')';
        } 
      }
      return caption_text;
    },
    
    setCaption: function() {
      var self = this,
          $caption = self.$el.find('.caption');
      //show caption
      $caption.find('p').text(self.getCaption());
      //show additional message in tooltip 
      $caption.attr('title', self.model.get('vttype') +' (' +self.model.get('vtname') +')');
    },
    
    // draw chart
    render: function () { 
      var self = this,
          grandParent = this.parent.parent,
          $chart = this.$el.find(".chart"),
          width  = $chart.width(),
          height = $chart.height();
          
      if(this.model.has('vtname')){ //fetch successful
        this.chartctrl.getContent(self.model.get('vtname'), self.model.get('vttype'), 
           grandParent.context, {width: width, height:height})
          .done( function () {
            self.setCaption();
            //content
            var $chart = self.$el.find('.chart');
            var renderd_dom = self.chartctrl.render(width, height);
            if(!!renderd_dom) {
              $chart.append(renderd_dom);
              if($(renderd_dom).is('svg') && $chart.find('svg').length==1) {
                self.resize_svg(renderd_dom, width, height);
              }
            }
            self.updateLinkMenu();
            self.updateModeIcon();
          })
          .fail(function(e) {
            console.log(e);
          });//done end
      }
      return this;
    },
    
    //popup menu in fixed position
    toggleDataMappingPanel: function (evt) {
      if (evt instanceof $.Event) { evt.stopPropagation(); }
      if( !_.isEmpty(this.chartctrl.dataManager().getMapperProps())) {
        framework.mediator.trigger('board:datamapping', this);
      }
      this.activeMe(evt); //update datamapping panel
    },

    //clear filter conditions for this chart
    clearFilter: function (evt) {
      if (evt instanceof $.Event) { 
        evt.stopPropagation();
        this.activeMe(evt); //update datamapping panel 
      }
      this.chartctrl.dataManager().clearFilter();
      
    },

    // add this to control panel
    toggleDesignPanel: function (evt) {
      if (evt instanceof $.Event) { evt.stopPropagation(); }
      framework.mediator.trigger('board:toggle_operation_panel', this);
      this.activeMe(evt); //update design panel
    },
    
    // add this to control panel
    toggleControlPanel: function (evt) {
      if (evt instanceof $.Event) { evt.stopPropagation(); }
      framework.mediator.trigger('board:toggle_operation_panel', this, (is_control_panel=true)); //link control flag
      this.activeMe(evt); //update control panel
    },
    
    showCaptionControl: function(evt) {
      if (evt instanceof $.Event) { 
        evt.stopPropagation();
        var $control = $("<div/>", {id: 'caption'})
                .data('type', 'text')
                .data('value', this.model.get('caption'));
        Wrapper.show($control, evt.originalEvent, this.model);
      }
      this.activeMe(evt); //update design/control panel
    },
    
    //undo
    undoUpdate: function() {
    },
    redoUpdate: function() {
    },
    
    toggleCaption: function() {
      var $caption = this.$el.find('.caption');
      if($caption.is(':visible')) {
        $caption.hide();
      } else {
        $caption.show();
      }
    },
    
    updateModeIcon: function() {
      var $modebutton = this.$el.find(".event-toggle-mode");
      if(this.chartctrl.isHighlightMode()){
        $modebutton.find('i.fa').removeClass('fa-filter');
        $modebutton.find('i.fa').addClass('fa-sun-o');
        $modebutton.show();
      } else 
      if(this.chartctrl.isDrilldownMode()) {
        $modebutton.find('i.fa').removeClass('fa-sun-o');
        $modebutton.find('i.fa').addClass('fa-filter');
        $modebutton.show(); 
      } else{
        $modebutton.hide();
      }
    },
    
    //mode change will update chart itself and icon(outside chart)
    toggleMode: function() {
      
      if(this.chartctrl.isHighlightMode()){
        this.chartctrl.setDrilldownMode();
      } else 
      if(this.chartctrl.isDrilldownMode()){
        this.chartctrl.setHighlightMode();
      }
      this.updateModeIcon();
      
      this.chartctrl.dataManager().switchMode();
    }
  });
  return BoardView;
});
