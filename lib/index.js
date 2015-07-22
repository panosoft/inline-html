var co = require('co');
var inlineLess = require('inline-less');
var inlineCssUrl = require('inline-css-url');
var cheerio = require('cheerio');
var string = require('string');
var fs = require('mz/fs');

// TODO refactor into separate module
// inline html images
var localPath = require('local-path');
var datauri = require('datauri');
var path = require('path');
var inlineImg = function (html, filePath) {
	var basedir = path.dirname(filePath);
	var $ = cheerio.load(html);
	var images = $('img').filter(function (index, element) {
		return localPath($(element).attr('src'));
	});
	images.each(function (index, element) {
		var src = $(element).attr('src');
		var filePath = path.resolve(basedir, src);
		src = datauri(filePath);
		$(element).attr('src', src);
	});
	return $.html();
};

// TODO refactor into separate module
// inline html url css data types
var inlineUrl = function (html, filePath) {
	var $ = cheerio.load(html);
	// style elements
	var styles = $('style');
	styles.each(function (index, element) {
		var css = $(element).html();
		css = inlineCssUrl(css, filePath);
		$(element).html(css);
	});
	// style attributes
	var attributes = $('body *').filter('[style]');
	attributes.each(function (index, element) {
		var css = $(element).attr('style');
		var prefix = 'element {';
		var suffix = '}';
		css = prefix + css + suffix;
		css = inlineCssUrl(css, filePath);
		css = string(css).collapseWhitespace().toString();
		css = css.replace(new RegExp('^' + prefix + '\\s*(.*)\\s+' + suffix + '$'), '$1');
		$(element).attr('style', css);
	});
	return $.html();
};

var inline = co.wrap(function * (filePath, options) {
	var html = yield fs.readFile(filePath, 'utf8');
	// inline links: less
	html = yield inlineLess(html, filePath, options);
	// TODO inline links: css
	// TODO inline scripts (js + browserify? = scriptify)

	// Inline local assets (path -> datauri)
	html = inlineUrl(html, filePath);
	html = inlineImg(html, filePath);
	// svg?

	return html;
});
module.exports = inline;
