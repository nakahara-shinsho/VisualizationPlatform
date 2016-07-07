/**
 * tools for sqlite
 */
function sqlite_tool() {
    /**
     * get sqlite tables from file name
     * @param {string} file path
     * @param {string} file name
     * @return {array string}sqlite tables
     */
    this.getTables = function(path, filename) {
	var sqliteCommand = "sqlite3 -header --csv  "+ path + filename + " .table";
	var exec = require("execsyncs");
	var StringDecoder = require('string_decoder').StringDecoder;
	var decoder = new StringDecoder('UTF-8');
	var result = exec(sqliteCommand);
	var words = decoder.write(result).split(/\s+/);
	var tables = [];
	words.forEach(function (elem) {
		if (elem != "") {
		    tables.push(elem);
		}
	    });
	return tables;
    };
    /**
     * chekck whether sqlite file or not
     * @param {string} file name
     * @return {bool} true or false
     */
    this.isDb = function(filename) {
	var ext = filename.split('.').pop().toLowerCase();
	if (ext==='db' || ext ==='sqlite' || ext ==='sqlite3') {
	    return true;
	} else {
	    return false;
	}
    }
    /**
     * execute sqlite "select" from file name and table name
     * @param {string} file path
     * @param {string} file name
     * @param {string} table name
     * @return {array string} selected data
     */
    this.select = function(path, filename, tableName) {
	var selectCommand = "\"select * from " + tableName + ";\"";
	var sqliteCommand = "sqlite3 -header --csv  "+ path + filename + " " + selectCommand;
	var exec = require("execsyncs");
	var StringDecoder = require('string_decoder').StringDecoder;
	var decoder = new StringDecoder('UTF-8');
	var result = exec(sqliteCommand);
	var data = decoder.write(result);	
	return data;
    }
};
module.exports = sqlite_tool;