const datauri = require('datauri');
const isLocalPath = require('is-local-path');
const isTemplateExpression = require('./is-template-expression');
const path = require('path');
const postcss = require('postcss');
const postcssUrl = require('postcss-url');
const R = require('ramda');
const string = require('string');
const url = require('url');

const collapseWhitespace = str => string(str).collapseWhitespace().toString();
const forEachIndexed = R.addIndex(R.forEach);
const resolve = path.resolve;

const augmentError = (error, filename, files) => {
	if (!error.filename) error.filename = filename;
	error.files = R.uniq(R.concat(files, error.files || []));
	return error;
};

/**
 * Returns url path without query string and hash if present.
 *
 * @param path
 * @returns path
 */
const cleanUrl = R.pipe(
	url.parse,
	R.pick(['protocol', 'host', 'pathname']),
	url.format,
	decodeURI
);
/**
 * Convert local url data type paths to datauris.
 *
 * @param css
 * @param filename
 * @returns {{css: (css|any), files: Array}}
 */
const inlineUrl = R.curry((filename, css) => {
	const basePath = path.dirname(filename);
	var files = [];
	const inline = url => {
		try {
			if (isLocalPath(url) && !isTemplateExpression(url)) {
				url = cleanUrl(url);
				url = resolve(basePath, url);
				files = R.append(url, files);
				url = datauri(url);
			}
			return url;
		}
		catch (error) { throw augmentError(error, filename, files); }
	};
	css = postcss()
		.use(postcssUrl({ url: inline }))
		.process(css)
		.css;
	files = R.uniq(files);
	return { css, files };
});

const inlineStyles = ($, filename) => {
	var files = [];
	try {
		const styles = $('style')
			.toArray();
		const contents = R.map(style => {
			const css = $(style).html();
			const result = inlineUrl(filename, css);
			files = R.concat(files, result.files);
			return result.css;
		}, styles);
		const replaceStyle = (style, index) => $(style).html(contents[index]);
		forEachIndexed(replaceStyle, styles);
		return { $, files };
	}
	catch (error) { throw augmentError(error, filename, files); }
};

const prefix = 'selector {';
const suffix = '}';
const matchStyle = new RegExp(`^${prefix}\\s*(.*)\\s*${suffix}$`);
const wrap = style => `${prefix}${style}${suffix}`;
const unwrap = rule => rule.replace(matchStyle, '$1');

const inlineStyleAttributes = ($, filename) => {
	var files = [];
	try {
		const elements = $('*')
			.filter('[style]')
			.toArray();
		const styles = R.map(element => {
			var style = $(element).attr('style');
			const rule = wrap(style);
			const result = inlineUrl(filename, rule);
			files = R.concat(files, result.files);
			style = R.pipe( collapseWhitespace, unwrap )(result.css);
			return style;
		}, elements);
		const replaceElementStyle = (element, index) => $(element).attr('style', styles[index]);
		forEachIndexed(replaceElementStyle, elements);
		return { $, files };
	}
	catch (error) { throw augmentError(error, filename, files); }
};

const inlineCssUrl = function ($, filename) {
	var files = [];
	try {
		var result;
		result = inlineStyles($, filename);
		$ = result.$;
		files = R.concat(files, result.files);

		result = inlineStyleAttributes($, filename);
		$ = result.$;
		files = R.concat(files, result.files);

		files = R.uniq(files);
		return { $, files };
	}
	catch (error) { throw augmentError(error, filename, files); }
};

module.exports = inlineCssUrl;
