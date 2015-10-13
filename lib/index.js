var co = require('co');
var fs = require('mz/fs');
var inlineStyle = require('./inline-style');
var inlineImg = require('./inline-img');
var inlineLess = require('./inline-less');
var R = require('ramda');
var Ru = require('@panosoft/ramda-utils');

var inlineHtml = {};
/**
 * Embed referenced local assets within and HTML file.
 *
 * @param {String} html
 * @param {Object} options
 *
 * @return {Promise}
 */
inlineHtml.html = co.wrap(function * (html, options) {
	options = Ru.defaults({
		filename: null,
		less: {},
		verbose: false
	}, options || {});
	var filename = options.filename;

	// Embed assets
	var files = [filename];
	try {
		var lessResult = yield inlineLess(html, filename, options.less);
		html = lessResult.html;
		files = R.concat(files, lessResult.files);

		var styleResult = inlineStyle(html, filename);
		html = styleResult.html;
		files = R.concat(files, styleResult.files);

		var imgResult = inlineImg(html, filename);
		html = imgResult.html;
		files = R.concat(files, imgResult.files);
	}
	catch (error) {
		if (!error.filename) error.filename = filename;
		error.files = R.uniq(R.concat(files, error.files || []));
		throw error;
	}

	files = R.uniq(files);
	var result = { html, files };
	return (options.verbose ? result : result.html);
});

inlineHtml.file = co.wrap(function * (filename, options) {
	var html = yield fs.readFile(filename, 'utf8');
	options = R.merge(options || {}, {filename});
	return yield inlineHtml.html(html, options);
});

module.exports = inlineHtml;
