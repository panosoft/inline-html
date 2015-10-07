var co = require('co');
var cheerio = require('cheerio');
var fs = require('mz/fs');
var isLocalPath = require('is-local-path');
var less = require('less');
var path = require('path');
var R = require('ramda');
var Ru = require('@panosoft/ramda-utils');

var render = co.wrap(function * (filename, options) {
	options = R.merge(options || {}, { filename });
	var contents = yield fs.readFile(filename, 'utf8');
	return yield less.render(contents, options);
});
/**
 * @param {String} html
 * 	HTML source to inline
 * @param {String} filename
 * 	Filename to apply to the HTML source being inlined
 * @param {Object} options
 * 	LESS compiler options
 */
var inlineLess = co.wrap(function * (html, filename, options) {
	options = Ru.defaults({
		relativeUrls: true
	}, options || {});
	var basedir = path.dirname(filename);

	// get links
	var $ = cheerio.load(html, {decodeEntities: false});
	var $links = $('link[rel="stylesheet/less"]')
		.filter((index, element) => isLocalPath($(element).attr('href')));

	// render LESS stylesheets
	var files = [];
	var outputs = [];
	try {
		$links.each((index, element) => {
			var href = $(element).attr('href');
			var filename = path.resolve(basedir, href);
			files = R.append(filename, files);
			outputs = R.append(render(filename, options), outputs);
		});
		outputs = yield outputs;
	}
	catch (error) {
		if (!error.filename) error.filename = filename;
		error.files = R.uniq(files);
		throw error;
	}

	// include imported filenames in files array
	files = R.concat(files, R.flatten(R.map(output => output.imports, outputs)));
	files = R.uniq(files);

	// replace links
	$links.each((index, element) => {
		var style = $('<style>').html(outputs[index].css);
		$(element).replaceWith(style);
	});

	return {
		html: $.xml(),
		files
	};
});
module.exports = inlineLess;
