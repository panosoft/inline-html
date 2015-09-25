var datauri = require('datauri');
var isLocalPath = require('is-local-path');
var isTemplateExpression = require('./is-template-expression');
var path = require('path');
var postcss = require('postcss');
var postcssUrl = require('postcss-url');
var R = require('ramda');
var url = require('url');

/**
 * Returns url path without query string and hash if present.
 *
 * @param path
 *
 * @returns path
 */
var clean = function (path) {
	path = url.parse(path);
	path = R.pick(['protocol', 'host', 'pathname'], path);
	path = url.format(path);
	path = decodeURI(path);
	return path;
};
/**
 * Convert local url data type paths to datauris.
 *
 * @param css
 * @param filename
 * @returns {{css: (css|any), files: Array}}
 */
var inline = function (css, filename) {
	var files = [];
	var basePath = path.dirname(filename);
	var result = postcss()
		.use(postcssUrl({
			url: function (urlPath) {
				if (isLocalPath(urlPath) && !isTemplateExpression(urlPath)) {
					urlPath = clean(urlPath);
					urlPath = path.resolve(basePath, urlPath);
					files.push(urlPath);
					urlPath = datauri(urlPath);
				}
				return urlPath;
			}
		}))
		.process(css);
	return {
		css: result.css,
		files: files
	};
};

module.exports = inline;
