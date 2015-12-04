const cheerio = require('cheerio');
const co = require('co');
const fs = require('mz/fs');
const inlineCssUrl = require('./css-url');
const inlineImg = require('./img');
const inlineLess = require('./link-less');
const inlineLinkCss = require('./link-css');
const inlineScript = require('./script');
const R = require('ramda');
const Ru = require('@panosoft/ramda-utils');

var inline = {};
/**
 * Embed referenced local assets within and HTML file.
 *
 * @param {String} html
 * @param {Object} options
 *
 * @return {Promise}
 */
inline.html = co.wrap(function * (html, options) {
	options = Ru.defaults({
		filename: '.',
		less: {},
		verbose: false
	}, options || {});

	const filename = options.filename;
	var files = [filename];
	try {
		var $ = cheerio.load(html, {decodeEntities: false});

		var result;
		result = yield inlineLess($, filename, options);
		$ = result.$;
		files = R.concat(files, result.files);

		result = yield inlineLinkCss($, filename, options);
		$ = result.$;
		files = R.concat(files, result.files);

		result = inlineCssUrl($, filename, options);
		$ = result.$;
		files = R.concat(files, result.files);

		result = yield inlineImg($, filename, options);
		$ = result.$;
		files = R.concat(files, result.files);

		result = yield inlineScript($, filename, options);
		$ = result.$;
		files = R.concat(files, result.files);

		html = $.xml();
		files = R.uniq(files);
		return (options.verbose ? { html, files } : html);
	}
	catch (error) {
		if (!error.filename) error.filename = filename;
		error.files = R.uniq(R.concat(files, error.files || []));
		throw error;
	}
});

inline.file = co.wrap(function * (filename, options) {
	const html = yield fs.readFile(filename, 'utf8');
	options = R.merge(options || {}, {filename});
	return yield inline.html(html, options);
});

module.exports = inline;
