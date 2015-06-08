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
	}
}