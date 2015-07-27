var datauri = require('datauri');
var isLocalPath = require('is-local-path');
var path = require('path');
var postcss = require('postcss');
var url = require('postcss-url');

var inline = function (css, filename) {
	var files = [];
	var basePath = path.dirname(filename);
	var result = postcss()
		.use(url({
			url: function (url) {
				if (isLocalPath(url)) {
					url = path.resolve(basePath, url);
					files.push(url);
					url = datauri(url);
				}
				return url;
			}
		}))
		.process(css);
	return {
		css: result.css,
		files: files
	};
};

module.exports = inline;
