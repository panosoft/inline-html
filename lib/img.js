const co = require('co');
const datauri = require('datauri').promises;
const isLocalPath = require('is-local-path');
const isTemplateExpression = require('./is-template-expression');
const path = require('path');
const R = require('ramda');

const forEachIndexed = R.addIndex(R.forEach);

/**
 * Inline sourced image files
 *
 * @param {Object} $
 * 	Parsed HTML source to inline
 * @param {String} filename
 * 	Filename used to resolve relative sources being inlined
 */
const inlineImg = co.wrap(function * ($, filename) {
	const basedir = path.dirname(filename);
	var files;
	try {
		const images = $('img')
			.filter((index, element) => {
				const source = $(element).attr('src');
				return isLocalPath(source) && !isTemplateExpression(source);
			})
			.toArray();
		const getFilename = element => path.resolve(basedir, $(element).attr('src'));
		const filenames = R.map(getFilename, images);
		files = R.uniq(filenames);
		const uris = yield R.map(datauri, filenames);
		const replaceImageSource = (image, index) => $(image).attr('src', uris[index]);
		forEachIndexed(replaceImageSource, images);
		return { $, files };
	}
	catch (error) {
		error.filename = filename;
		error.files = files;
		throw error;
	}
});

module.exports = inlineImg;
