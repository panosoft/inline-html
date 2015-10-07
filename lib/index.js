var co = require('co');
var fs = require('mz/fs');
var inlineStyle = require('./inline-style');
var inlineImg = require('./inline-img');
var inlineLess = require('./inline-less');
var R = require('ramda');
var Ru = require('@panosoft/ramda-utils');

/**
 * Embed referenced local assets within and HTML file.
 *
 * @param {String} html
 *         Filename or html string.
 * @param {Object} options
 *
 * @return {Promise}
 */
var inlineHtml = co.wrap(function * (html, options) {
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
		if (error.code === 'ENOENT') filename = options.filename;
		else throw error;
	}

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
	var result = {
		html,
		files
	};
	return (options.verbose ? result : result.html);
});

module.exports = inlineHtml;
