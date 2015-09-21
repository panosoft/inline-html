var co = require('co');
var cheerio = require('cheerio');
var fs = require('mz/fs');
var inlineStyle = require('./inline-style');
var inlineImg = require('./inline-img');
var inlineLinkLess = require('./inline-link-less');
var R = require('ramda');
var Ru = require('@panosoft/ramda-utils');

var inline = co.wrap(function * (html, options) {
	options = Ru.defaults({
		filename: null,
		less: {},
		verbose: false
	}, options || {});
	var filename;
	try {
		filename = html;
		html = yield fs.readFile(filename, 'utf8');
	}
	catch (error) {
		if (error.code === 'ENOENT') {
			filename = options.filename;
		}
		else {
			throw error;
		}
	}
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
		files: R.uniq(R.flatten(files, true))
	};
	return (options.verbose ? result : result.html);
});

module.exports = inline;
