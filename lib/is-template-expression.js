/**
 * Tests whether a path is a mustache template expression.
 *
 * Note: would be best if this was file extension specific
 * (i.e. *.hbs => test for `{{ }}` )
 *
 * @param {String} path
 * @return {Boolean}
 */
const isTemplateExpression = path => /^{{.*}}$/.test(path);

module.exports = isTemplateExpression;
