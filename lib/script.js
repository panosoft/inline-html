const co = require('co');
const fs = require('mz/fs');
const isLocalPath = require('is-local-path');
const isTemplateExpression = require('./is-template-expression');
const path = require('path');
const R = require('ramda');

const forEachIndexed = R.addIndex(R.forEach);

const inlineScript = co.wrap(function * ($, filename) {
  var basedir = path.dirname(filename);
  var files;
  try {
    const scripts = $('script')
      .filter((index, element) => {
        const source = $(element).attr('src');
        return isLocalPath(source) && !isTemplateExpression(source);
      })
      .toArray();
    const getFilename = element => path.resolve(basedir, $(element).attr('src'));
    const filenames = R.map(getFilename, scripts);
    files = R.uniq(filenames);
    const readFile = filename => fs.readFile(filename, 'utf8');
    const contents = yield R.map(readFile, filenames);
    const replaceScript = (script, index) => $(script).attr('src', null).html(contents[index]);
    forEachIndexed(replaceScript, scripts);
    return { $, files };
  }
  catch (error) {
    error.filename = filename;
		error.files = files;
		throw error;
  }
});

module.exports = inlineScript;
