const co = require('co');
const datauri = require('datauri');
const expect = require('chai')
	.use(require('chai-as-promised'))
	.expect;
const fs = require('fs');
const inline = require('../lib');
const path = require('path');

describe('inline-html', () => {

	describe('file()', () => {
		it('exists', () => expect(inline).to.have.property('file').that.is.a('function'));

		it('accept html filename', () => {
			const filename = path.resolve(__dirname, './fixtures/file.txt');
			const content = fs.readFileSync(filename, 'utf8');
			return expect(inline.file(filename)).to.eventually.equal(content);
		});

		it('options.filename: always reset to current filename and used for css url path resolution', () => {
			const filename = path.resolve(__dirname, 'fixtures/css-url.html'); // file contains url path relative to itself
			const options = { filename: __filename }; // sets filename relative to this test file
			return expect(inline.file(filename, options)).to.eventually.match(/"data:.*,.*"/);
		});
		it('options.filename:  always reset to current filename and used for img src path resolution', () => {
			const filename = path.resolve(__dirname, 'fixtures/img.html'); // file contains src relative to itself
			const options = { filename: __filename }; // sets filename relative to this test file
			return expect(inline.file(filename, options)).to.eventually.match(/"data:.*,.*"/);
		});

		it('throw error when file not found', () => expect(inline.file('missing.html')).to.eventually.be.rejected);
	});

	describe('html()', () => {
		it('exists', () => expect(inline).to.have.property('html').that.is.a('function'));

		it('accept html string', () => {
			const html = 'HTML';
			return expect(inline.html(html)).to.eventually.equal(html);
		});
		it('preserve self closing tags', () => {
			const html = '<br/>';
			return expect(inline.html(html)).to.eventually.equal(html);
		});
		it('preserve partials', () => {
			const html = '{{> partial}}';
			return expect(inline.html(html)).to.eventually.equal(html);
		});
		it('preserve helpers', () => {
			const html = '{{helper}}';
			return expect(inline.html(html)).to.eventually.equal(html);
		});

		it('options.filename: default to cwd for css url path resolution', () => {
			const url = 'test/fixtures/file.txt'; // Note: this is relative to cwd
			const uri = datauri(url);

			const html = (path) => `<style>div { background-image: url('${path}'); }</style>`;
			return expect(inline.html(html(url))).to.eventually.equal(html(uri));
		});
		it('options.filename: set basepath for css url path resolution', () => {
			const filename = path.resolve(__dirname, 'fixtures/fake.html');
			const dirname = path.dirname(filename);

			const url = 'file.txt'; // Note: path relative to filename's dirname
			const uri = datauri(path.resolve(dirname, url));

			const html = (path) => `<style>div { background-image: url('${path}'); }</style>`;
			const options = { filename: filename };
			return expect(inline.html(html(url), options)).to.eventually.equal(html(uri));
		});

		it('options.filename: default to cwd for img src path resolution', () => {
			const url = 'test/fixtures/file.txt'; // Note: path relative to cwd
			const uri = datauri(url);

			const html = (path) => `<img src="${path}"/>`;
			return expect(inline.html(html(url))).to.eventually.equal(html(uri));
		});
		it('options.filename: set basepath for img src path resolution', () => {
			const filename = path.resolve(__dirname, 'fixtures/fake.html');
			const dirname = path.dirname(filename);

			const url = 'file.txt'; // Note: path relative to filename's dirname
			const uri = datauri(path.resolve(dirname, url));

			const html = (path) => `<img src="${path}"/>`;
			const options = { filename: filename };
			return expect(inline.html(html(url), options)).to.eventually.equal(html(uri));
		});

		it('options.filename: included in results.files for img src if options.verbose true', () => {
			const filename = path.resolve(__dirname, 'fixtures/file.txt');
			const html = `<img src="${filename}"/>`;
			const options = { verbose: true };
			return expect(inline.html(html, options)).to.eventually.have.property('files')
				.that.is.an('array')
				.that.contains(filename);
		});
		it('options.filename: included in results.files for css url path if options.verbose true', () => {
			const filename = path.resolve(__dirname, 'fixtures/file.txt');
			const html = `<style>div { background-image: url('${filename}'); }</style>`;
			const options = { verbose: true };
			return expect(inline.html(html, options)).to.eventually.have.property('files')
				.that.is.an('array')
				.that.contains(filename);
		});


		it('options.verbose: return results object if true', () => {
			const filename = path.resolve(__dirname, 'fixtures/file.txt');
			const html = `<img src="${filename}"/>`;
			const options = { verbose: true };
			return expect(inline.html(html, options)).to.eventually.be.an('object')
				.that.contains.keys(['html', 'files']);
		});
		it('options.verbose: return html if false', () => {
			const filename = path.resolve(__dirname, 'fixtures/file.txt');
			const html = `<img src="${filename}"/>`;
			const options = { verbose: false };
			return expect(inline.html(html, options)).to.eventually.be.a('string');
		});
		it('options.verbose: default false', () => {
			const filename = path.resolve(__dirname, 'fixtures/file.txt');
			const html = `<img src="${filename}"/>`;
			return expect(inline.html(html)).to.eventually.be.a('string');
		});


		describe('css-url', () => {
			it('inline local url in style element', () => {
				const filename = path.resolve(__dirname, 'fixtures/file.txt');
				const html = `<style>div {background-image: url("${filename}");}</style>`;
				return expect(inline.html(html)).to.eventually.match(/data:.*,.*/);
			});
			it('inline local url in style attribute', () => {
				const filename = path.resolve(__dirname, 'fixtures/file.txt');
				const html = `<div style="background-image: url('${filename}');"></div>`;
				return expect(inline.html(html)).to.eventually.match(/data:.*,.*/);
			});
			it('ignore remote url', () => {
				const html = `<style> div { background-image: url('http://test.com/file.txt?query=string#hash'); }</style>`;
				return expect(inline.html(html)).to.eventually.equal(html);
			});
			it('ignore template expression url', () => {
				const html = `<style> div { background-image: url({{path}}); }</style>`;
				return expect(inline.html(html)).to.eventually.equal(html);
			});
			it('ignore url query strings and hashes', () => {
				const filename = path.resolve(__dirname, 'fixtures/file.txt');
				const url = `${filename}?query=string#hash`;
				const uri = datauri(filename);
				const html = (source) => `<style> div { background-image: url('${source}'); }</style>`;
				return expect(inline.html(html(url))).to.eventually.equal(html(uri));
			});
			it('handle url with spaces', () => {
				const filename = path.resolve(__dirname, 'fixtures/file space.txt');
				const uri = datauri(filename);
				const html = (source) => `<style> div { background-image: url('${source}'); }</style>`;
				return expect(inline.html(html(filename))).to.eventually.equal(html(uri));
			});
			it('throw when syntax invalid in style element', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const html = `<style>div {</style>`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(filename);
				}
			}));
			it('throw when syntax invalid in style attribute', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const html = `<div style="background url()"></div>`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(filename);
				}
			}));
			it('throw when url invalid in style element', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const url = 'missing.png';
				const resolvedUrl = path.resolve(path.dirname(filename), url);
				const html = `<style>div { background-image: url('${url}'); }</style>`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(resolvedUrl);
				}
			}));
		it('throw when url invalid in style attribute ', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const url = 'missing.png';
				const resolvedUrl = path.resolve(path.dirname(filename), url);
				const html = `<div style="background-image: url('${url}')"></div>`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(resolvedUrl);
				}
			}));
			it('include all urls in error.files up until and including invalid url in style element', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const validUrl = 'fixtures/file.txt';
				const invalidUrl = 'missing.png';
				const resolvedInvalidUrl = path.resolve(path.dirname(filename), invalidUrl);
				const resolvedValidUrl = path.resolve(path.dirname(filename), validUrl);
				const html = `
					<style>div {background-image: url('${validUrl}');}</style>
					<style>div {background-image: url('${invalidUrl}');}</style>
				`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(resolvedValidUrl);
					expect(error).to.have.property('files').that.contains(resolvedInvalidUrl);
				}
			}));
			it('include all urls in error.files up until and including invalid url in style attribute', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const validUrl = 'fixtures/file.txt';
				const invalidUrl = 'missing.png';
				const resolvedInvalidUrl = path.resolve(path.dirname(filename), invalidUrl);
				const resolvedValidUrl = path.resolve(path.dirname(filename), validUrl);
				const html = `
					<div style="background-image: url('${validUrl}')"></div>
					<div style="background-image: url('${invalidUrl}')"></div>
				`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(resolvedValidUrl);
					expect(error).to.have.property('files').that.contains(resolvedInvalidUrl);
				}
			}));
			it('include all urls in error.files up until and including invalid url when style element valid and style attribute invalid', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const validUrl = 'fixtures/file.txt';
				const invalidUrl = 'missing.png';
				const resolvedInvalidUrl = path.resolve(path.dirname(filename), invalidUrl);
				const resolvedValidUrl = path.resolve(path.dirname(filename), validUrl);
				const html = `
					<style>div {background-image: url("${validUrl}");}</style>
					<div style="background-image: url('${invalidUrl}')"></div>
				`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(resolvedValidUrl);
					expect(error).to.have.property('files').that.contains(resolvedInvalidUrl);
				}
			}));
		});

		describe('img', () => {
			it('inline local source', () => {
				const filename = path.resolve(__dirname, 'fixtures/file.txt');
				const html = `<img src="${filename}"/>`;
				return expect(inline.html(html)).to.eventually.match(/data:.*,.*/);
			});
			it('ignore remote source', () => {
				const html = `<img src="http://test.com/file.txt?query=string#hash"/>`;
				return expect(inline.html(html)).to.eventually.equal(html);
			});
			it('ignore template expression source', () => {
				const html = `<img src="{{path}}"/>`;
				return expect(inline.html(html)).to.eventually.equal(html);
			});
			it('throw when src invalid', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const source = 'missing.png';
				const html = `<img src="${source}" >`;
				const resolvedSource = path.resolve(path.dirname(filename), source);
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(resolvedSource);
				}
			}));
			it('include all sources in error.files up until and including invalid source', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const valid = 'fixtures/file.txt';
				const invalid = 'missing.png';
				const resolvedInvalid = path.resolve(path.dirname(filename), invalid);
				const resolvedValid = path.resolve(path.dirname(filename), valid);
				const html = `
					<img src="${valid}">
					<img src="${invalid}">
				`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(resolvedValid);
					expect(error).to.have.property('files').that.contains(resolvedInvalid);
				}
			}));
		});

		describe('link-css', () => {
		  const filename = path.resolve(__dirname, 'index.html');
		  const link = (href) => `<link rel="stylesheet" href="${href}"/>`;
		  it('inline local href', () => co(function * () {
		    const href = path.resolve(__dirname, 'fixtures/basic.css');
		    const html = link(href);
		    const result = yield inline.html(html);
		    expect(result).to.match(/<style>[^]*basic.css[^]*<\/style>/);
		  }));
		  it('ignore remote href', () => co(function * () {
		    const html = link('http://test.com/main.less');
		    const result = yield inline.html(html);
		    expect(result).to.equal(html);
		  }));
		  it('ignore template expression href', () => co(function * () {
		    const html = link('{{href}}');
		    const result = yield inline.html(html);
		    expect(result).to.equal(html);
		  }));
		  it('inline local nested imports', () => co(function * () {
		    const href = path.resolve(__dirname, 'fixtures/nested-import.css');
		    const html = link(href);
		    const result = yield inline.html(html);
		    return expect(result).to.match(/<style>[^]*basic.css[^]*<\/style>/)
		      .and.not.match(/@import/);
		  }));
		  it('rebase urls relative to html filename', () => co(function * () {
		    const href = 'fixtures/url.css';
		    const html = link(href);
		    const result = yield inline.html(html, { filename });
		    expect(result).to.match(/<style>[^]*url\('data:.*,.*'\)[^]*<\/style>/);
		  }));
		  it('throw error when href invalid', () => co(function * () {
		    const invalid = 'fixtures/missing.css';
		    const invalidResolved = path.resolve(path.dirname(filename), invalid);
		    const html = link(invalid);
		    try {
		      yield inline.html(html, { filename });
		      throw new Error('No error thrown');
		    }
		    catch (error) {
		      expect(error).to.have.property('filename').that.equals(filename);
		      expect(error).to.have.property('files').that.contains(invalidResolved);
		    }
		  }));
		  it('throw error when import path invalid', () => co(function * () {
		    const invalid = 'fixtures/invalid-import.css';
		    const invalidResolved = path.resolve(path.dirname(filename), invalid);
		    const html = link(invalid);
		    try {
		      yield inline.html(html, { filename });
		      throw new Error('No error thrown');
		    }
		    catch (error) {
		      expect(error).to.have.property('filename').that.equals(invalidResolved);
		      expect(error).to.have.property('files').that.contains(invalidResolved);
		    }
		  }));
		  it('throw error when css syntax invalid', () => co(function * () {
		    const invalid = 'fixtures/invalid-syntax.css';
		    const invalidResolved = path.resolve(path.dirname(filename), invalid);
		    const html = link(invalid);
		    try {
		      yield inline.html(html, { filename });
		      throw new Error('No error thrown');
		    }
		    catch (error) {
		      expect(error).to.have.property('filename').that.equals(invalidResolved);
		      expect(error).to.have.property('files').that.contains(invalidResolved);
		    }
		  }));
		  it('include all local hrefs in error.files when error encountered', () => co(function * () {
		    const valid = 'fixtures/basic.css';
		    const invalid = 'fixtures/missing.css';
		    const validResolved = path.resolve(path.dirname(filename), valid);
		    const invalidResolved = path.resolve(path.dirname(filename), invalid);
		    const html = `${link(invalid)}${link(valid)}`;
		    try {
		      yield inline.html(html, { filename });
		      throw new Error('No error thrown');
		    }
		    catch (error) {
		      expect(error).to.have.property('filename').that.equals(filename);
		      expect(error).to.have.property('files').that.contains(validResolved);
		      expect(error).to.have.property('files').that.contains(invalidResolved);
		    }
		  }));
		});

		describe('link-less', () => {
			it('inline local href', () => {
				const filename = path.resolve(__dirname, 'fixtures/basic.less');
				const html = `<link rel="stylesheet/less" href="${filename}"/>`;
				return expect(inline.html(html)).to.eventually.match(/<style>[^]*basic.less[^]*<\/style>/);
			});
			it('ignore remote href', () => {
				const html = `<link rel="stylesheet/less" href="http://test.com/main.less"/>`;
				return expect(inline.html(html)).to.eventually.equal(html);
			});
			it('ignore template expression href', () => {
				const html = `<link rel="stylesheet/less" href="{{href}}"/>`;
				return expect(inline.html(html)).to.eventually.equal(html);
			});
			it('inline local nested imports', () => {
				const filename = path.resolve(__dirname, 'fixtures/nested-import.less');
				const html = `<link rel="stylesheet/less" href="${filename}"/>`;
				return expect(inline.html(html)).to.eventually.match(/<style>[^]*basic.less[^]*basic.css[^]*<\/style>/)
					.and.not.match(/@import/);
			});
			it('rebase urls relative to html filename', () => {
				const filename = path.resolve(__dirname, 'index.html');
				const href = 'fixtures/url.less';
				const html = `<link rel="stylesheet/less" href="${href}"/>`;
				return expect(inline.html(html, { filename })).to.eventually.match(/<style>[^]*url\('data:.*,.*'\)[^]*<\/style>/);
			});
			it('throw error when link href invalid', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const href = 'missing.less';
				const resolvedHref = path.resolve(path.dirname(filename), href);
				const html = `<link rel="stylesheet/less" href="${href}">`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(resolvedHref);
				}
			}));
			it('throw error when less import invalid', () => co(function * () {
				const filename = path.resolve(__dirname, 'fixtures/index.html');
				const lessBasename = 'invalid-import.less';
				const lessFilename = path.resolve(path.dirname(filename), lessBasename);
				const html = `<link rel="stylesheet/less" href="${lessBasename}">`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(lessFilename);
					expect(error).to.have.property('files').that.contains(lessFilename);
				}
			}));
			it('throw error when less syntax invalid', () => co(function * () {
				const filename = path.resolve(__dirname, 'fixtures/index.html');
				const lessBasename = 'invalid-syntax.less';
				const lessFilename = path.resolve(path.dirname(filename), lessBasename);
				const html = `<link rel="stylesheet/less" href="${lessBasename}">`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(lessFilename);
					expect(error).to.have.property('files').that.contains(lessFilename);
				}
			}));
			it('include all local hrefs in error.files when error encountered', () => co(function * () {
				const filename = path.resolve(__dirname, 'index.html');
				const valid = 'fixtures/basic.css';
				const invalid = 'fixtures/missing.css';
				const validResolved = path.resolve(path.dirname(filename), valid);
				const invalidResolved = path.resolve(path.dirname(filename), invalid);
				const html = `
					<link rel="stylesheet/less" href="${invalid}">
					<link rel="stylesheet/less" href="${valid}">
				`;
				try {
					yield inline.html(html, {filename});
					throw new Error('No error thrown');
				}
				catch (error) {
					expect(error).to.have.property('filename').that.equals(filename);
					expect(error).to.have.property('files').that.contains(validResolved);
					expect(error).to.have.property('files').that.contains(invalidResolved);
				}
			}));
		});

		describe('script', () => {
			it('inline local src', () => {
				const source = path.resolve(__dirname, 'fixtures/file.txt');
				const html = `<script src="${source}"></script>`;
				const contents = fs.readFileSync(source, 'utf8');
				return expect(inline.html(html)).to.eventually.equal(`<script>${contents}</script>`);
			});
			it('ignore remote src', () => {
				const html = `<script src="http://test.com/file.txt?query=string#hash"/>`;
				return expect(inline.html(html)).to.eventually.equal(html);
			});
			it('ignore template expression src', () => {
				const html = `<script src="{{path}}"/>`;
				return expect(inline.html(html)).to.eventually.equal(html);
			});
			it('throw when source invalid', () => co(function * () {
					const filename = path.resolve(__dirname, 'index.html');
					const source = 'missing.js';
					const html = `<script src="${source}"></script>`;
					const resolvedSource = path.resolve(path.dirname(filename), source);
					try {
						yield inline.html(html, {filename});
						throw new Error('No error thrown');
					}
					catch (error) {
						expect(error).to.have.property('filename').that.equals(filename);
						expect(error).to.have.property('files').that.contains(resolvedSource);
					}
				})
			);
			it('include all sources in error.files up until and including invalid source', () => {
				return co(function * () {
					const filename = path.resolve(__dirname, 'index.html');
					const valid = 'fixtures/file.txt';
					const invalid = 'missing.js';
					const resolvedInvalid = path.resolve(path.dirname(filename), invalid);
					const resolvedValid = path.resolve(path.dirname(filename), valid);
					const html = `
						<script src="${valid}"></script>
						<script src="${invalid}"></script>
					`;
					try {
						yield inline.html(html, {filename});
						throw new Error('No error thrown');
					}
					catch (error) {
						expect(error).to.have.property('filename').that.equals(filename);
						expect(error).to.have.property('files').that.contains(resolvedValid);
						expect(error).to.have.property('files').that.contains(resolvedInvalid);
					}
				});
			});
		});
	});
});
