/**
 * @fileoverview implement for replacing log4js for console modules
 * @author Dan Umeda
 * @copyright Toshiba Corporation
 */

var log4js = require('log4js');
	log4js.configure({
	    appenders: [
		{
		    "type": "dateFile",
			"category": "log",
			"filename": "./server/logs/console.log",
			"pattern": "-yyyy-MM-dd",
			"backups": 3
		},
		{
		    "type": "dateFile",
			"category": "error",
			"filename": "./server/logs/console.error",
			"pattern": "-yyyy-MM-dd",
			"backups": 3
		},
		{
		    "type": "dateFile",
			"category": "assert",
			"filename": "./server/logs/console.assert",
			"pattern": "-yyyy-MM-dd",
			"backups": 3
		},
		{
		    "type": "dateFile",
			"category": "warn",
			"filename": "./server/logs/console.warn",
			"pattern": "-yyyy-MM-dd",
			"backups": 3
		}
		],
		    "levels": {"log": "ALL"}
	 });
module.exports = {
log : function (caller, text) {
	var args = createText(caller, text);
	var logger = log4js.getLogger('log');
	logger.info(args); 
    },
error : function (caller, text) {
	var args = createText(caller, text);
	var logger = log4js.getLogger('error');
	logger.error(args); 
    },
assert : function (caller, text) {
	var args = createText(caller, text);
	var logger = log4js.getLogger('assert');
	logger.fatal(args); 
    },
warn : function (caller, text) {
	var args = createText(caller, text);
	var logger = log4js.getLogger('warn');
	logger.warn(args); 
    }
};
Error.prepareStackTrace = function( e, st ) {
    return {
    functionName: st[0].getFunctionName(),
    lineNumber: st[0].getLineNumber(),
    fileName: st[0].getFileName()
    };
};
createText = function (caller, text) {
   var obj = {};
    Error.captureStackTrace( obj, caller );
    var args;
    if (typeof text == "object") {
       text = JSON.stringify(text);
    }
    if (obj.stack.functionName == null) {
	args = text + " ("+ obj.stack.fileName +":" + obj.stack.lineNumber + ")"	
    } else {
	args = text + " ("+ obj.stack.fileName + " ("+obj.stack.functionName  + ") :" + obj.stack.lineNumber + ")"
    }

   return args;
};
