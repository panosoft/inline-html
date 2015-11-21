const co = require('co');
const fs = require('mz/fs');
const isLocalPath = require('is-local-path');
const less = require('less');
const path = require('path');
const R = require('ramda');
const Ru = require('@panosoft/ramda-utils');

const forEachIndexed = R.addIndex(R.forEach);
const resolve = R.curry((a,b) => path.resolve(a,b));

const render = R.curryN(2, co.wrap(function * (options, filename) {
	options = R.merge(options || {}, { filename });
	const contents = yield fs.readFile(filename, 'utf8');
	return yield less.render(contents, options);
}));
/**
 * Inline linked less files
 *
 * @param {Object} $
 * 	Parsed HTML source to inline
 * @param {String} filename
 * 	Filename to apply to the HTML source being inlined
 * @param {Object} [options]
 * @param {Object} [options.less]
 * 	LESS compiler options
 */
const inlineLess = co.wrap(function * ($, filename, options) {
	options = Ru.defaults({ less: {} }, options || {});
	options = Ru.defaults({ relativeUrls: true }, options.less);
	var files = [];
	const basedir = path.dirname(filename);
	const getAttr = R.curry((attr, element) => $(element).attr(attr));
	const getStylesheet = R.pipe(getAttr('href'), resolve(basedir));
	try {
		const links = $('link[rel="stylesheet/less"]')
			.filter((index, link) => isLocalPath($(link).attr('href')))
			.toArray();

		const stylesheets = R.map(getStylesheet, links);
		files = R.concat(files, stylesheets);
		const outputs = yield R.map(render(options), stylesheets);
		const imports = R.flatten(R.map(R.prop('imports'), outputs));
		files = R.concat(files, imports);
		const styles = R.map(output => $('<style>').html(output.css), outputs);

		forEachIndexed((link, index) => $(link).replaceWith(styles[index]), links);

		files = R.uniq(files);
		return { $, files };
	}
	catch (error) {
		if (!error.filename) error.filename = filename;
		error.files = R.uniq(files);
		throw error;
	}
});
module.exports = inlineLess;
