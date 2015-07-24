var _ = require('lodash');
var co = require('co');
var cheerio = require('cheerio');
var fs = require('mz/fs');
var isLocalPath = require('is-local-path');
var less = require('less');
var path = require('path');
var url = require('url');

var render = co.wrap(function * (filename, options) {
	options = _.assign(options || {}, {
		filename: filename
	});
	var contents = yield fs.readFile(filename, 'utf8');
	return yield less.render(contents, options);
});
/**
 * @params html
 * 	HTML to inline
 * @params options
 * 	LESS compiler options
 */
var inline = co.wrap(function * (html, filename, options) {
	var files = [];
	var basedir = path.dirname(filename);
	options = _.defaults(options || {}, {
		relativeUrls: true
	});

	// TODO Import less links
	// get links
	var $ = cheerio.load(html, {decodeEntities: false});
	var links = $('link[rel="stylesheet/less"]')
		.filter(function (index, element) {
			return isLocalPath($(element).attr('href'));
		});

	// render stylesheets
	var outputs = [];
	links.each(function (index, element) {
		var href = $(element).attr('href');
		var filename = path.resolve(basedir, href);
		files.push(filename);
		outputs.push(render(filename, options));
	});
	outputs = yield outputs;

	// replace links
	links.each(function (index, element) {
		var style = $('<style>').html(outputs[index].css);
		$(element).replaceWith(style);
	});

	// create list of imported files from all outputs, unique listing
	files.push(_.map(outputs, function (output) {
		return output.imports;
	}));

	return {
		html: $.html(),
		files: files
	};
});
module.exports = inline;
