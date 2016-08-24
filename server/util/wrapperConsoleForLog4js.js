/**
 * @fileoverview implement for wrapper of replacing log4js for console modules
 * @author Dan Umeda
 * @copyright Toshiba Corporation
 */
//Ex) LOG4JS=on node start.js
var log4js = process.env.LOG4JS;
if (log4js != undefined && log4js == "on") {
    var func = require('./consoleForLog4js');
    console.log = function caller(text) {
	func.log(caller, text);
    };
    console.error = function caller(text) {
	func.error(caller, text);
    };
    console.assert = function caller(text) {
	func.assert(caller, text);
    };
    console.warn = function caller(text) {
	func.warn(caller, text);
    };
}
