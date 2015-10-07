var cheerio = require('cheerio');
var datauri = require('datauri');
var isLocalPath = require('is-local-path');
var isTemplateExpression = require('./is-template-expression');
var path = require('path');
var R = require('ramda');

var inline = function (html, filename) {
	var files = [];
	var basedir = path.dirname(filename);
	var $ = cheerio.load(html, {decodeEntities: false});
	var $images = $('img').filter((index, element) => {
		var path = $(element).attr('src');
		return isLocalPath(path) && !isTemplateExpression(path);
	});
	try {
		$images.each((index, element) => {
			var source = $(element).attr('src');
			var filename = path.resolve(basedir, source);
			files = R.append(filename, files);
			var uri = datauri(filename);
			$(element).attr('src', uri);
		});
	}
	catch (error) {
		error.filename = filename;
		error.files = R.uniq(files);
		throw error;
	}
	files = R.uniq(files);
	return {
		html: $.xml(),
		files
	};
};

module.exports = inline;
