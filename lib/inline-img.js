var cheerio = require('cheerio');
var datauri = require('datauri');
var isLocalPath = require('is-local-path');
var path = require('path');

var inline = function (html, filename) {
	var files = [];
	var basedir = path.dirname(filename);
	var $ = cheerio.load(html, {decodeEntities: false});
	var images = $('img').filter(function (index, element) {
		return isLocalPath($(element).attr('src'));
	});
	images.each(function (index, element) {
		var src = $(element).attr('src');
		var filename = path.resolve(basedir, src);
		files.push(filename);
		src = datauri(filename);
		$(element).attr('src', src);
	});
	return {
		html: $.html(),
		files: files
	};
};

module.exports = inline;
