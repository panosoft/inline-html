var cheerio = require('cheerio');
var inlineUrl = require('./inline-css-url');
var R = require('ramda');
var string = require('string');

var prefix = 'element {';
var suffix = '}';
var wrap = function (value) {
	return prefix + value + suffix;
};
var unwrap = function (value) {
	var regexp = new RegExp('^' + prefix + '\\s*(.*)\\s*' + suffix + '$');
	return value.replace(regexp, '$1');
};
var inlineStyle = function (html, filename) {
	var files = [];
	var $ = cheerio.load(html, {decodeEntities: false});

	try {
		// style elements
		var $styles = $('style');
		$styles.each((index, element) => {
			var css = $(element).html();
			var result = inlineUrl(css, filename);
			files = R.concat(files, result.files);
			$(element).html(result.css);
		});

		// style attributes
		var $attributes = $('*').filter('[style]');
		$attributes.each((index, element) => {
			var css = $(element).attr('style');
			css = wrap(css);
			var result = inlineUrl(css, filename);
			files = R.concat(files, result.files);
			css = string(result.css).collapseWhitespace().toString();
			css = unwrap(css);
			$(element).attr('style', css);
		});
	}
	catch (error) {
		if (!error.filename) error.filename = filename;
		error.files = R.uniq(R.concat(files, error.files || []));
		throw error;
	}

	files = R.uniq(files);
	return {
		html: $.xml(),
		files
	};
};

module.exports = inlineStyle;
