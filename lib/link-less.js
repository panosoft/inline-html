const co = require('co');
const fs = require('mz/fs');
const isLocalPath = require('is-local-path');
const less = require('less');
const path = require('path');
const R = require('ramda');
const Ru = require('@panosoft/ramda-utils');

const forEachIndexed = R.addIndex(R.forEach);

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
	const basedir = path.dirname(filename);
	var files = [];
	try {
		const links = $('link[rel="stylesheet/less"]')
			.filter((index, link) => isLocalPath($(link).attr('href')))
			.toArray();
		const getHref = element => path.resolve(basedir, $(element).attr('href'));
		const hrefs = R.map(getHref, links);
		files = R.concat(files, hrefs);
		const outputs = yield R.map(render(options), hrefs);
		const imports = R.flatten(R.map(R.prop('imports'), outputs));
		files = R.concat(files, imports);
		const styles = R.map(output => $('<style>').html(output.css), outputs);
		const replaceLink = (link, index) => $(link).replaceWith(styles[index]);
		forEachIndexed(replaceLink, links);
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
