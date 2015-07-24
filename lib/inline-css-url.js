var datauri = require('datauri');
var isLocalPath = require('is-local-path');
var path = require('path');
var rework = require('rework');
var url = require('rework-plugin-url');

var inline = function (css, filename) {
	var files = [];
	var basePath = path.dirname(filename);
	css = rework(css)
		.use(url(function (url) {
			if (isLocalPath(url)) {
				url = path.resolve(basePath, url);
				files.push(url);
				url = datauri(url);
			}
			return url;
		}))
		.toString();
	return {
		css: css,
		files: files
	};
};

module.exports = inline;
