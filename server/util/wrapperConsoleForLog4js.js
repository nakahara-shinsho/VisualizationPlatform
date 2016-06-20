/**
 * @fileoverview implement for wrapper of replacing log4js for console modules
 * @author Dan Umeda
 * @copyright Toshiba Corporation
 */

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

