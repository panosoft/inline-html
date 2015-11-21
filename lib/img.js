const co = require('co');
const datauri = require('datauri').promises;
const isLocalPath = require('is-local-path');
const isTemplateExpression = require('./is-template-expression');
const path = require('path');
const R = require('ramda');

const forEachIndexed = R.addIndex(R.forEach);
const resolve = R.curry((a,b) => path.resolve(a,b));

/**
 * Inline sourced image files
 *
 * @param {Object} $
 * 	Parsed HTML source to inline
 * @param {String} filename
 * 	Filename used to resolve relative sources being inlined
 */
const inlineImg = co.wrap(function * ($, filename) {
	var files;
	const basedir = path.dirname(filename);
	const getAttr = R.curry((attr, element) => $(element).attr(attr));
	const setAttr = R.curry((attr, element, value) => $(element).attr(attr, value));
	const getFilename = R.pipe(getAttr('src'), resolve(basedir));
	try {
		const images = $('img')
			.filter((index, element) => {
				const source = $(element).attr('src');
				return isLocalPath(source) && !isTemplateExpression(source);
			})
			.toArray();

		const filenames = R.map(getFilename, images);
		files = R.uniq(filenames);
		const uris = yield R.map(datauri, filenames);

		forEachIndexed((image, index) => setAttr('src', image, uris[index]), images);
		
		return { $, files };
	}
	catch (error) {
		error.filename = filename;
		error.files = files;
		throw error;
	}
});

module.exports = inlineImg;
