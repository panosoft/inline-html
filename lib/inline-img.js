var cheerio = require('cheerio');
var datauri = require('datauri');
var isLocalPath = require('is-local-path');
var isTemplateExpression = require('./is-template-expression');
var path = require('path');

var inline = function (html, filename) {
	var files = [];
	var basedir = path.dirname(filename);
	var $ = cheerio.load(html, {decodeEntities: false});
	var images = $('img').filter(function (index, element) {
		var path = $(element).attr('src');
		return isLocalPath(path) && !isTemplateExpression(path);
	});
	images.each(function (index, element) {
		var src = $(element).attr('src');
		var filename = path.resolve(basedir, src);
		files.push(filename);
		src = datauri(filename);
		$(element).attr('src', src);
	});
	return {
		html: $.xml(),
		files: files
	};
};

module.exports = inline;
