'use strict'

var regexes = require('./boring/regexes.json');
var literals = require('./boring/literals.json').join('|');
var regexStr = regexes.join('|') + '|\\b(' + literals + ')\\b';
var psqlRegex = regexStr.replace(/'/g, "''").replace(/\\b/g, "\\y");
var regex = new RegExp(regexStr);

module.exports = {
	check: function (text) {
		if(text) {
			var result = text.toLowerCase().match(regex);
			return result ? result[0] : null;
		} else {
			return null;
		}
	},
	getRegexes: function() { return regexes; },
	getRegex: function() { return regex.toString(); },
	getPsqlRegex: function() { return psqlRegex; }
}