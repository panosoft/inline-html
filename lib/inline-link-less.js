var _ = require('lodash');
var co = require('co');
var cheerio = require('cheerio');
var fs = require('mz/fs');
var isLocalPath = require('is-local-path');
var less = require('less');
var path = require('path');
var url = require('url');

var render = co.wrap(function * (filepath, options) {
	options = _.assign(options || {}, {
		filename: filepath
	});
	var contents = yield fs.readFile(filepath, 'utf8');
	var output = yield less.render(contents, options);
	return output.css;
});
/**
 * @params html
 * 	HTML to inline
 * @params options
 * 	LESS compiler options
 */
var inline = co.wrap(function * (html, filepath, options) {
	var basedir = path.dirname(filepath);
	options = _.defaults(options || {}, {
		relativeUrls: true
	});

	// TODO Import less links
	// get links
	var $ = cheerio.load(html);
	var links = $('link[rel="stylesheet/less"]')
		.filter(function (index, element) {
			return isLocalPath($(element).attr('href'));
		});

	// render stylesheets
	var contents = [];
	links.each(function (index, element) {
		var href = $(element).attr('href');
		var filepath = path.resolve(basedir, href);
		contents.push(render(filepath, options));
	});
	contents = yield contents;

	// TODO for each content: convert css url path -> datauri
	// can use inline-css-url

	// replace links
	links.each(function (index, element) {
		var style = $('<style>').html(contents[index]);
		$(element).replaceWith(style);
	});

	return $.html();
});
module.exports = inline;
