/**
 * @fileOverview implement for showing tooltips
 */

/** @module CustomTooltip*/

/**
 * Show and hide tooltip if need
 * @class CustomTooltip
 * @param {type} tooltipId id of element define tooltip in html file
 * @param {type} width width of tooltip
 * @returns {CustomTooltip}
 */
define(["css!./OldTooltip"],function(){
  
  var CustomTooltip = function(id, w) {
    var tooltipId = id;
    var width = w;

    this.showTooltip= function(content, event) {
        $("#" + tooltipId).html(content);
        $("#" + tooltipId).show();

        this.updatePosition(event);
    };

    this.hideTooltip = function() {
        $("#" + tooltipId).hide();
    };

    this.updatePosition=function(event) {
        var ttid = "#" + tooltipId;
        var xOffset = 20;
        var yOffset = 10;

        var ttw = $(ttid).width();
        var tth = $(ttid).height();
        var wscrY = $(window).scrollTop();
        var wscrX = $(window).scrollLeft();
        var curX = (document.all) ? event.clientX + wscrX : event.pageX;
        var curY = (document.all) ? event.clientY + wscrY : event.pageY;
        var ttleft = ((curX - wscrX + xOffset * 2 + ttw) > $(window).width()) ?
              curX - ttw - xOffset * 2 : curX + xOffset;
        if (ttleft < wscrX + xOffset) {
            ttleft = wscrX + xOffset;
        }
        var tttop = ((curY - wscrY + yOffset * 2 + tth) > $(window).height()) ? 
            curY - tth - yOffset * 2 : curY + yOffset;
        if (tttop < wscrY + yOffset) {
            tttop = curY + yOffset;
        }
        $(ttid).css('top', tttop + 'px').css('left', ttleft + 'px');
    };
    
    if (typeof $(".tooltip") !== 'undefined') {
        $(".tooltip").remove();
    }

    $("body").append("<div class='tooltip' id='" + tooltipId + "'></div>");

    if (width) {
        $("#" + tooltipId).css("width", width);
    }

    this.hideTooltip();
  };
  return CustomTooltip;
});

