/**
 * @fileOverview implement for PieChart
 * @author VuongND
 * @version 1.0
 * @copyright TSDV
 */

define(['jquery', 'd3', 'ControlPanel', 'jsColor','css!css/PieChart', 'css!css/CommonCss'], function($, d3, ControlPanel, jsColor) {

    /**
     * Constructor
     * @class PieChartControl
     * @param {number} width - width of view
     * @param {string} id - id of chart
     * @param {Object} pie - PieChart object
     * @returns {PieChartControl}
     */
    function PieChartControl(width, id, pie) {
        ControlPanel.call(this, width, id);
        this.pie = pie;
    }

    // indicate this class is inherited from ControlPanel class
    PieChartControl.prototype = Object.create(ControlPanel.prototype);

    /**
     * for render control panel
     * @memberOf PieChartControl
     * @returns {undefined}
     */
    PieChartControl.prototype.render = function() {
        // append div to bound entire control panel
        d3.select('#' + this.id).append('div')
                .attr({
                    "id": "control_panel_pie_chart",
                    "height": "100%",
                    "width": "100px",
                    "class": "hidden"
                });

        var _this = this;
        var div_control_panel = d3.select('#control_panel_pie_chart');
        // append div to contain header of control pannel
        div_control_panel.append('div')
                .attr({
                    "id": "trigger_pie_chart",
                    "class": "trigger_panel"
                });
        // append text for div header which name for control panel
        d3.select('#trigger_pie_chart').append('text')
                .text('Control PieChart ');
        // append text for div header to set icon for trigger
        d3.select('#trigger_pie_chart').append('text')
                .attr('id', 'icon_trigger_pie_chart')
                .text('>>');

        // append selectbox which contain all legend of chart
        div_control_panel.append('select')
                .attr({
                    "id": "legend_more_pie_chart",
                    "multiple": "true"
                })
                .on('change', function() {
                    _this.pie.checkSelection();
                    addOption(_this.pie.select);
                    controlElement(_this.pie.select);
                    initializeColorForInputTag();
                })
                ;
        // add option for selectbox
        d3.select('#legend_more_pie_chart').selectAll('option').data(_this.pie.allLegend)
            .enter()
            .append("option")
            .text(function(d) { return d;});
        // create checkbox to change axis
        var changeAxis = div_control_panel.append("span").attr("id", "span_change_axis_pie_chart");

        changeAxis.append("input")
            .attr({
                type: "checkbox",
                id: "change_axis_pie_chart"
            })
            .property("checked", _this.pie.defaultCheckboxChangeAxis)
            .on("change", function() {
                _this.pie.changeAxis();
                disableElement();
            });

        changeAxis.append("label").text("Change axis");

        // create total checkbox
        var changeAxis = div_control_panel.append("span").attr("id", "span_total_pie_chart");

        changeAxis.append("input")
            .attr({
                type: "checkbox",
                id: "total_pie_chart"
            })
            .property("checked", _this.pie.defaultCheckboxTotal)
            .on("change", function() {
                _this.pie.drawTotal();
                initializeColorForInputTag();
            });

        changeAxis.append("label").text("Total");

        // append selectbox to change color for pie chart
        div_control_panel.append('select')
                .attr({
                    "id": "change_color_pie_chart"
                })
                .property('disabled', 'disabled')
                .on('change', function() {
                    var selected = $('#change_color_pie_chart').find(":selected").text();
                    setColorForInputTag(selected);
                })
                ;
        // add option for selectbox
        d3.select('#change_color_pie_chart').selectAll('option').data(_this.pie.allLegend)
            .enter()
            .append("option")
            .text(function(d) { return d;});
        // append input tag to select color
        div_control_panel.append('input')
                .attr({
                    "id": "pick_color_pie_chart",
                    "class": "color {required:false}",
                    "value": ""
                })
                .property('disabled', 'disabled')
                .on("change", jQuery.proxy(this, 'changeColor'));

        // set click event for trigger
        $('#trigger_pie_chart').click(function() {
            if ($('#control_panel_pie_chart').hasClass('hidden')) {
                $('#control_panel_pie_chart').removeClass('hidden');
                $('#control_panel_pie_chart').animate({left: '-48px'}, 'slow', function() {
                    $('#icon_trigger_pie_chart').html('<<');
                });
            } else {
                $('#control_panel_pie_chart').addClass('hidden');
                $('#control_panel_pie_chart').animate({left: '-12%'}, 'slow', function() {
                    $('#icon_trigger_pie_chart').html('>>');
                });
            }
        });

    };

    /**
     * for change color of chart and legend
     * @memberOf PieChartControl
     * @returns {undefined}
     */
    PieChartControl.prototype.changeColor = function() {
        // get selected option
        var selection = d3.select('#change_color_pie_chart')[0][0].selectedOptions;
        // convert string of selected option
        var options = "pie_chart_" + selection[0].text.replace(/ /g, "_");
        // change color for chart
        d3.selectAll('.' + options).style('fill', $('#pick_color_pie_chart').css('background-color'));
        // change color for legend
        d3.selectAll('.legend_' + options).style('fill', $('#pick_color_pie_chart').css('background-color'));

    };

    /**
     * for adding option for selectbox which contains all legends
     * @memberOf PieChartControl
     * @param {type} options
     * @returns {undefined}
     */
    function addOption(options) {
        // remove all current options of selectbox
        $('#change_color_pie_chart').empty();
        // add new option for selectbox
        d3.select('#change_color_pie_chart').selectAll('option').data(options)
            .enter()
            .append("option")
            .text(function(d) { return d;});
    }

    /**
     * for setting color for input tag which pick color for chart and legend
     * @memberOf PieChartControl
     * @param {type} pie
     * @returns {undefined}
     */
    function setColorForInputTag(pie) {
        var element = 'pie_chart_' + pie.replace(/ /g, '_');
        // get color of selected legend
        var color = d3.select('.' + element).style('fill');
        // set color and value for input tag
        d3.select('#pick_color_pie_chart').style('background-color', color)
                .property('value', colorToHex(color));
    }

    /**
     * for initializing color for input tag (display color of first legend in selectbox)
     * @memberOf PieChartControl
     * @returns {undefined}
     */
    function initializeColorForInputTag() {
        var select = d3.select('#change_color_pie_chart')[0][0];
        setColorForInputTag(select[0].__data__);
    }

    /**
     * for setting enable or disable selectbox and input which support changing color
     * @param {type} select
     * @returns {undefined}
     */
    function controlElement(select) {
        if (select.length > 0) {
            enableElement();
        } else {
            disableElement();
        }
    }

    /**
     * for enable selectbox and input tag
     * @memberOf PieChartControl
     * @returns {undefined}
     */
    function enableElement() {
        d3.select('#change_color_pie_chart').property('disabled', false);
        d3.select('#pick_color_pie_chart').property('disabled', false);
    }

    /**
     * for disable selectbox and input tag
     * @memberOf PieChartControl
     * @returns {undefined}
     */
    function disableElement() {
        d3.select('#change_color_pie_chart').property('disabled', 'disabled');
        d3.select('#pick_color_pie_chart').property('disabled', 'disabled');
    }

    /**
     * for converting color form rgb to hex code
     * @memberOf PieChartControl
     * @param {type} color
     * @returns {String|_L8.colorToHex.digits|RegExp}
     */
    function colorToHex(color) {
        if (color.substr(0, 1) === '#') {
            return color;
        }

        var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);

        var red = parseInt(digits[2]);
        var green = parseInt(digits[3]);
        var blue = parseInt(digits[4]);

        var rgb = blue | (green << 8) | (red << 16);
        return (digits[1] + rgb.toString(16)).toUpperCase();
    }

    return PieChartControl;
});