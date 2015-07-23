var cheerio = require('cheerio');
var datauri = require('datauri');
var isLocalPath = require('is-local-path');
var path = require('path');

var inline = function (html, filePath) {
	var basedir = path.dirname(filePath);
	var $ = cheerio.load(html);
	var images = $('img').filter(function (index, element) {
		return isLocalPath($(element).attr('src'));
	});
	images.each(function (index, element) {
		var src = $(element).attr('src');
		var filePath = path.resolve(basedir, src);
		src = datauri(filePath);
		$(element).attr('src', src);
	});
	return $.html();
};

module.exports = inline;
