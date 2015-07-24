var _ = require('lodash');
var co = require('co');
var cheerio = require('cheerio');
var fs = require('mz/fs');
var inlineStyle = require('./inline-style');
var inlineImg = require('./inline-img');
var inlineLinkLess = require('./inline-link-less');

var inline = co.wrap(function * (filename, options) {
	options = _.defaults(options || {}, {
		less: {},
		verbose: false
	});
	var html = yield fs.readFile(filename, 'utf8');
	var files = [filename];

	// Inline links
	var lessResult = yield inlineLinkLess(html, filename, options.less);
	html = lessResult.html;
	files.push(lessResult.files);

	// TODO inline links: css

	// TODO inline scripts
	// browserify js? => scriptify

	// Inline paths -> datauris
	var styleResult = inlineStyle(html, filename); // Inline styles
	html = styleResult.html;
	files.push(styleResult.files);

	var imgResult = inlineImg(html, filename); // Inline images
	html = imgResult.html;
	files.push(imgResult.files);

	var result = {
		html: html,
		files: _.unique(_.flatten(files, true))
	};
	return (options.verbose ? result : result.html);
});

module.exports = inline;
