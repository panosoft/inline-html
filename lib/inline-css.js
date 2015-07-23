var cheerio = require('cheerio');
var inlineUrl = require('./inline-css-url');
var string = require('string');

var prefix = 'element {';
var suffix = '}';
var wrap = function (value) {
	return prefix + value + suffix;
};
var unwrap = function (value) {
	var regexp = new RegExp('^' + prefix + '\\s*(.*)\\s+' + suffix + '$');
	return value.replace(regexp, '$1');
};
var inline = function (html, filePath) {
	var $ = cheerio.load(html, {decodeEntities: false});

	// style elements
	var styles = $('style');
	styles.each(function (index, element) {
		var css = $(element).html();
		css = inlineUrl(css, filePath);
		$(element).html(css);
	});

	// style attributes
	var attributes = $('body *').filter('[style]');
	attributes.each(function (index, element) {
		var css = $(element).attr('style');
		css = wrap(css);
		css = inlineUrl(css, filePath);
		css = string(css).collapseWhitespace().toString();
		css = unwrap(css);
		$(element).attr('style', css);
	});

	return $.html();
};

module.exports = inline;