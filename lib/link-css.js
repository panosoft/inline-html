const co = require('co');
const fs = require('mz/fs');
const isLocalPath = require('is-local-path');
const isTemplateExpression = require('./is-template-expression');
const path = require('path');
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const postcssUrl = require('postcss-url');
const R = require('ramda');

const forEachIndexed = R.addIndex(R.forEach);
const render = R.curryN(2, co.wrap(function * (filename, href) {
  var imports;
  const processor = postcss()
    .use(postcssImport({ async: true, onImport: files => imports = files }))
    .use(postcssUrl({ url: 'rebase' }));
  try {
    const css = yield fs.readFile(href, 'utf8');
    const result = yield processor.process(css, { from: href, to: filename });
    const output = {css: result.css, imports};
    return output;
  }
  catch (error) {
    // process uses error.file = href
    // import uses error.fileName
    // readFile uses nothing => use filename
    error.filename = error.file || error.fileName || filename;
    throw error;
  }
}));
/**
 * Inline liked CSS stylesheets by replacing link elements with
 * style elements that contain the css file contents.
 * @param {Object} $
 * 	Parsed HTML source to inline
 * @param {String} [filename='.']
 *  Filename of the HTML document contained within $
 * @return {Promise}
 */
const inlineLinkCss = co.wrap(function * ($, filename) {
  // TODO consider: explicitly default filename = '.'?
  // path.dirname(null || undefined) -> '.'
  const basedir = path.dirname(filename);
  var files = [];
  try {
    const links = $('link[rel="stylesheet"]')
			.filter((index, link) => {
				const href = $(link).attr('href');
				return isLocalPath(href) && !isTemplateExpression(href);
			})
			.toArray();
    const getHref = element => path.resolve(basedir, $(element).attr('href'));
    const hrefs = R.map(getHref, links);
    files = R.concat(files, hrefs);
    const outputs = yield R.map(render(filename), hrefs);
		const imports = R.flatten(R.map(R.prop('imports'), outputs));
		files = R.concat(files, imports);
    const styles = R.map(output => $('<style>').html(output.css), outputs);
		const replaceLink = (link, index) => $(link).replaceWith(styles[index]);
		forEachIndexed(replaceLink, links);
		files = R.uniq(files);
		return { $, files };
  }
  catch (error) {
    if (!error.filename) error.filename = filename;
		error.files = R.uniq(files);
		throw error;
  }
});
module.exports = inlineLinkCss;
