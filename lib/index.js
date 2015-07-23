var _ = require('lodash');
var co = require('co');
var cheerio = require('cheerio');
var fs = require('mz/fs');
var inlineCss = require('./inline-css');
var inlineImg = require('./inline-img');
var inlineLinkLess = require('./inline-link-less');

var inline = co.wrap(function * (filename, options) {
	options = _.defaults(options || {}, {
		less: {}
	});
	var html = yield fs.readFile(filename, 'utf8');

	// Inline links
	html = yield inlineLinkLess(html, filename, options.less);
	// TODO inline links: css

	// TODO inline scripts
	// browserify js? => scriptify

	// Inline paths -> datauris
	html = inlineCss(html, filename);
	html = inlineImg(html, filename);

	return html;
});

module.exports = inline;
