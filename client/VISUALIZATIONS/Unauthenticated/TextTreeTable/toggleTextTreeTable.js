/**
 * @fileOverview Use to support for Text Tree Table
 * @author ThongKN
 * @version 1.0
 * @copyright TSDV
 */

/**
 * Expand first childs of folder when click on folder's icon
 * @method toggleRows
 * @memberOf TextTreeTable
 * @param {type} elm element that want to toggle
 */
define(function () {
  /**
   * Constructor
   * @class ToggleTextTreeTable
   * @returns {ToggleTextTreeTable}
   */
  var ToggleTextTreeTable = function () {
  };

  /**
   * Toggle rows
   * @memberOf ToggleTextTreeTable
   * @param {Element} elm
   */
  ToggleTextTreeTable.prototype.toggleRows = function (elm) {
    var rows = document.getElementsByTagName("TR"),
      newDisplay = "none",
      thisID = elm.parentNode.parentNode.parentNode.id + "-";

    // change icon for folder
    elm.className = 'folder-close';

    // Are we expanding or contracting? If the first child is hidden, we expand
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];

      if (matchStart(r.id, thisID, true)) {
        if (r.style.display == "none") {
          if (document.all)
            newDisplay = "block"; //IE4+ specific code
          else
            newDisplay = "table-row"; //Netscape and Mozilla
          // change icon for folder
          elm.className = 'folder-open';
        }
        break;
      }
    }

    // When expanding, only expand one level.  Collapse all desendants.
    var matchDirectChildrenOnly = (newDisplay != "none");

    for (var j = 0; j < rows.length; j++) {
      var s = rows[j];

      if (matchStart(s.id, thisID, matchDirectChildrenOnly)) {
        s.style.display = newDisplay;
        var cell = s.getElementsByTagName("TD")[0],
          tier = cell.getElementsByTagName("DIV")[0],
          folder = tier.getElementsByTagName("A")[0];

        if (folder.getAttribute("onclick") != null) {
          folder.className = 'folder-close'
        }
      }
    }
  }

  /**
   * Check match with input target or not
   * @method matchStart
   * @memberOf ToggleTextTreeTable
   * @param {type} target
   * @param {type} pattern
   * @param {type} matchDirectChildrenOnly
   * @returns {Boolean} True if match. False if not match
   */
  ToggleTextTreeTable.prototype.matchStart = function (target, pattern, matchDirectChildrenOnly) {
    var pos = target.indexOf(pattern);

    if (pos != 0)
      return false;

    if (!matchDirectChildrenOnly)
      return true;

    if (target.slice(pos + pattern.length, target.length).indexOf("-") >= 0)
      return false;

    return true;
  }

  /**
   * Expand all directory
   * @method expandAllRows
   * @memberOf ToggleTextTreeTable
   */
  ToggleTextTreeTable.prototype.expandAllRows = function (chart) {
    var rows = document.getElementsByTagName("TR"),
      folder = document.getElementsByClassName("folder");
    chart.io.setValue('groupRadio', "Expand All");
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var anchorFolder = this.getAnchorOfRow(r);

      if (anchorFolder) {
        if (anchorFolder.className === 'folder-close') {
          // change icon for folder
          anchorFolder.className = 'folder-open';
        }
      }

      if (r.style.display === "none") {
        if (document.all)
          newDisplay = "block"; //IE4+ specific code
        else
          newDisplay = "table-row"; //Netscape and Mozilla
        r.style.display = newDisplay;
      }
    }
  }

  /**
   * Collapse all directory
   * @method collapseAllRows
   * @memberOf ToggleTextTreeTable
   */
  ToggleTextTreeTable.prototype.collapseAllRows = function (chart) {
    var rows = document.getElementsByTagName("TR");
    chart.io.setValue('groupRadio', "Collapse All");
    for (var j = 0; j < rows.length; j++) {
      var r = rows[j];

      if (r.id.indexOf("-") >= 0) {
        r.style.display = "none";
      }
      else if (r.id === '0') {
        var anchorFolder = this.getAnchorOfRow(r);

        if (anchorFolder) {
          if (anchorFolder.className === 'folder-open') {
            // change icon for folder
            anchorFolder.className = 'folder-close';
          }
        }
      }
    }
  }

  /**
   * Get anchor (A tag) of input row
   * @method getAnchorOfRow
   * @memberOf ToggleTextTreeTable
   * @param {type} row this row want to anchor
   * @returns {Boolean}
   * * True: return associated anchor.
   * * False: cell is null or undefined, div is null or undefined, anchor is null or undefined
   */
  ToggleTextTreeTable.prototype.getAnchorOfRow = function (row) {
    var cell, tier, anchor;

    cell = row.getElementsByTagName("TD")[0];
    if (!cell)
      return false;

    tier = cell.getElementsByTagName("DIV")[0];
    if (!tier)
      return false;

    anchor = tier.getElementsByTagName("A")[0];
    if (!anchor)
      return false;

    return anchor;
  }
  return  ToggleTextTreeTable;
});