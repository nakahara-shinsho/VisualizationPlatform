/**
 * Create ManagementVTPageView main function
 *
 * @class ManagementVTPageView
 * @param {type} _ - underscore.js
 * @param {type} ManagementVTPageTpl - ManagementVTPage html template
 * @param {type} ManagementVTViewTpl - ManagementVTView html template
 * @returns {ManagementVTPageView}
 */
define([
  'underscore',
  'text!templates/managementVTPage.html',
  'text!templates/managementVTView.html'
], function (
  _,
  ManagementVTPageTpl,
  ManagementVTViewTpl
  ) {
  /**
   * Constructor create VitualTable
   * @method VitualTable
   * @memberOf VitualTable
  */
  var VitualTable = Backbone.View.extend({
    events: {
      'click .close-button': 'onCloseBtnClicked'
    },
    className: 'management-vt-view',
    /**
     * Template for vitual table
     */
    template: _.template(ManagementVTViewTpl),
    /**
     * Data for first 20 rows
     */
    datas: [
      ['0', '63.4', '62.7', '72.2'],
      ['1', '58', '59.9', '67.7'],
      ['2', '53.3', '59.1', '69.4'],
      ['3', '55.7', '58.8', '68'],
      ['4', '64.2', '58.7', '72.4'],
      ['5', '58.8', '57', '77'],
      ['6', '57.9', '56.7', '82.3'],
      ['7', '61.8', '56.8', '78.9'],
      ['8', '69.3', '56.7', '68.8'],
      ['9', '71.2', '60.1', '68.7'],
      ['10', '68.7', '61.1', '70.3'],
      ['11', '61.8', '61.5', '75.3'],
      ['12', '63', '64.3', '76.6'],
      ['13', '66.9', '67.1', '66.6'],
      ['14', '61.7', '64.6', '68'],
      ['15', '61.8', '61.6', '70.6'],
      ['16', '62.8', '61.1', '71.1'],
      ['17', '60.8', '59.2', '70'],
      ['18', '62.1', '58.9', '61.6'],
      ['19', '65.1', '57.2', '57.4'],
    ],
    /**
     * Column header
     */
    columns: ['x', 'Alternative', 'Rhymth and Soul', 'Christian Rock'],
    /**
     * Constructor of this class
     */
    initialize: function (options) {
      this.vtid = options.vtid;
      this.name = options.name;
      this.noOfRows = options.noOfRows ? options.noOfRows : 10;
      this.getData(parseInt(this.vtid));
      this.render();
    },
    /**
     * Render HTML of this view
     */
    render: function () {
      var html = this.template({
        datas: this.datas,
        columns: this.columns,
        noOfRows: this.noOfRows,
        tableName: this.name
      });
      this.$el.html(html);
      this.$el.attr('data-view-vtid', this.vtid);
      return this;
    },
    /**
     * Get data with input vitual table id and set variable "datas" and "columns"
     * @params {number}
     */
    getData: function (vtid) {
      // TODO write function to get data from server
    },
    onCloseBtnClicked: function () {
      var this_ = this;
      this.$el.fadeOut(function () {
        this_.$el.remove();
      });
      // remove selected class of vt item in vt list
      $('[data-vtid=' + this.vtid + ']').removeClass('selected');
    }
  });

  // Show management page
  var ManagementVTPageView = Backbone.View.extend({
    vtlist: [
      {
        'id': '1',
        'name': 'vt1'
      },
      {
        'id': '2',
        'name': 'vt2'
      },
      {
        'id': '3',
        'name': 'vt3'
      },
      {
        'id': '4',
        'name': 'vt4'
      },
      {
        'id': '5',
        'name': 'vt5'
      },
      {
        'id': '6',
        'name': 'vt6'
      },

    ],
    /**
     * Maximum number of rows
     * @type {number}
     */
    noOfRows: 10,
    events: {
      'mousedown': 'onMousedownVTItem'
    },
    /**
     * Constructor of ManagementVTPageView class
     */
    initialize: function () {
      this.render();
      this.$('.second-column').on('drop', this.onDropSecondColumn.bind(this));
      this.$('.second-column').on('dragover', this.onDragOverSecondColumn.bind(this));
      this.$('.vt').on('dragstart', this.onDragFromVTList.bind(this));
    },
    /**
     * Render ManagementVTPageView
     */
    render: function () {
      this.template = _.template(ManagementVTPageTpl);
      this.$el.html(this.template({
        vtlist: this.vtlist
      }));
      return this;
    },
    /**
     * Handle onMouseDown event
     */
    onMousedownVTItem: function (evt) {
      var target = $(evt.target);
      target.addClass('pressed');
      $('body').one('mouseup', function () {
        target.removeClass('pressed');
      });
    },
    /**
     * Handle onDropSecondColumn event
     */
    onDropSecondColumn: function (ev) {
      ev.preventDefault();
      var vtid = ev.originalEvent.dataTransfer.getData('vtid');
      var name = ev.originalEvent.dataTransfer.getData('table-name');

      // check existence of vtid in this area
      if ($('[data-view-vtid=' + vtid + ']').length > 0) {
        alert('View have id ' + vtid + ' already existed');
        return;
      }

      var dataTable = new VitualTable({
        vtid: vtid,
        name: name,
        noOfRows: this.noOfRows
      });
      this.$('.second-column').append(dataTable.$el);
      $('.pressed').addClass('selected');
      $('.pressed').removeClass('pressed');
    },
    /**
     * Handle onDragOverSecondColumn event
     */
    onDragOverSecondColumn: function (ev) {
      ev.preventDefault();
    },
    /**
     * Handle onDragFromVTList event
     */
    onDragFromVTList: function (ev) {
      ev.originalEvent.dataTransfer.setData('vtid', $(ev.target).attr('data-vtid'));
      ev.originalEvent.dataTransfer.setData('table-name', $(ev.target).html());
    },
    /**
     * Handle destroy event
     */
    destroy: function () {
      this.$el.html('');
    }
  });

  return ManagementVTPageView;

});
