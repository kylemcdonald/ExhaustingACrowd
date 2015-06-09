'use strict'

var regexes = require('./boring/regexes.json');
require('./boring/literals.json').forEach(function(literal) {
	regexes.push('\\b' + literal + '\\b');
})
var regex = new RegExp(regexes.join('|'));

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
	getPsqlRegex: function() {
		return regex.toString()
	        .replace(/'/g, "''")
	        .replace(/\\b/g, "\\y")
	}
}