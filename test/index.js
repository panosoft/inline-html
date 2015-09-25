var inline = require('../lib');
var expect = require('chai')
	.use(require('chai-as-promised'))
	.expect;
var datauri = require('datauri');
var fs = require('fs');
var path = require('path');

describe('inlineHtml', function () {

	it('html: filename', function () {
		var filename = path.resolve(__dirname, './fixtures/file.txt');
		var content = fs.readFileSync(filename, 'utf8');
		return expect(inline(filename)).to.eventually.equal(content);
	});
	it('html: string', function () {
		var html = 'HTML';
		return expect(inline(html)).to.eventually.equal(html);
	});


	it('inline link less', function () {
		var filename = path.resolve(__dirname, 'fixtures/basic.less');
		var html = `<link rel="stylesheet/less" href="${filename}"/>`;
		return expect(inline(html)).to.eventually.match(/<style>[^]*<\/style>/);
	});
	it('inline link less imports', function () {
		var filename = path.resolve(__dirname, 'fixtures/import.less');
		var html = `<link rel="stylesheet/less" href="${filename}"/>`;
		return expect(inline(html)).to.eventually.match(/<style>[^]*<\/style>/)
			.and.not.match(/@import/);
	});
	it('inline css url path in style element', function () {
		var filename = path.resolve(__dirname, 'fixtures/file.txt');
		var html = `<style>div {background-image: url("${filename}");}</style>`;
		return expect(inline(html)).to.eventually.match(/data:.*,.*/);
	});
	it('inline css url path in element style attribute', function () {
		var filename = path.resolve(__dirname, 'fixtures/file.txt');
		var html = `<div style="background-image: url('${filename}');"></div>`;
		return expect(inline(html)).to.eventually.match(/data:.*,.*/);
	});
	it('inline img src', function () {
		var filename = path.resolve(__dirname, 'fixtures/file.txt');
		var html = `<img src="${filename}"/>`;
		return expect(inline(html)).to.eventually.match(/data:.*,.*/);
	});


	it('options.verbose: return results object if true', function () {
		var filename = path.resolve(__dirname, 'fixtures/file.txt');
		var html = `<img src="${filename}"/>`;
		var options = { verbose: true };
		return expect(inline(html, options)).to.eventually.be.an('object')
			.that.contains.keys(['html', 'files']);
	});
	it('options.verbose: return html if false', function () {
		var filename = path.resolve(__dirname, 'fixtures/file.txt');
		var html = `<img src="${filename}"/>`;
		var options = { verbose: false };
		return expect(inline(html, options)).to.eventually.be.a('string');
	});
	it('options.verbose: default false', function () {
		var filename = path.resolve(__dirname, 'fixtures/file.txt');
		var html = `<img src="${filename}"/>`;
		return expect(inline(html)).to.eventually.be.a('string');
	});


	it('options.filename: ignored for css url path resolution if html filename', function () {
		var html = path.resolve(__dirname, 'fixtures/css-url.html'); // file contains url path relative to itself
		var options = { filename: __filename }; // sets filename relative to this test file
		return expect(inline(html, options)).to.eventually.match(/"data:.*,.*"/);
	});
	it('options.filename: ignored for img src path resolution if html filename', function () {
		var html = path.resolve(__dirname, 'fixtures/img.html'); // file contains src relative to itself
		var options = { filename: __filename }; // sets filename relative to this test file
		return expect(inline(html, options)).to.eventually.match(/"data:.*,.*"/);
	});
	it('options.filename: set basepath for css url path resolution if html string', function () {
		var filename = path.resolve(__dirname, 'fixtures/fake.html');
		var dirname = path.dirname(filename);

		var url = 'file.txt'; // Note: path relative to filename's dirname
		var uri = datauri(path.resolve(dirname, url));

		var html = (path) => `<style>div { background-image: url('${path}'); }</style>`;
		var options = { filename: filename };
		return expect(inline(html(url), options)).to.eventually.equal(html(uri));
	});
	it('options.filename: set basepath for img src path resolution if html string', function () {
		var filename = path.resolve(__dirname, 'fixtures/fake.html');
		var dirname = path.dirname(filename);

		var url = 'file.txt'; // Note: path relative to filename's dirname
		var uri = datauri(path.resolve(dirname, url));

		var html = (path) => `<img src="${path}"/>`;
		var options = { filename: filename };
		return expect(inline(html(url), options)).to.eventually.equal(html(uri));
	});
	it('options.filename: default to cwd for css url path resolution if html string', function () {
		var url = 'test/fixtures/file.txt'; // Note: this is relative to cwd
		var uri = datauri(url);

		var html = (path) => `<style>div { background-image: url('${path}'); }</style>`;
		return expect(inline(html(url))).to.eventually.equal(html(uri));
	});
	it('options.filename: default to cwd for img src path resolution if html string', function () {
		var url = 'test/fixtures/file.txt'; // Note: path relative to cwd
		var uri = datauri(url);

		var html = (path) => `<img src="${path}"/>`;
		return expect(inline(html(url))).to.eventually.equal(html(uri));
	});
	it('options.filename: included in results.files for img src if html string and options.verbose true', function () {
		var filename = path.resolve(__dirname, 'fixtures/file.txt');
		var html = `<img src="${filename}"/>`;
		var options = { verbose: true };
		return expect(inline(html, options)).to.eventually.have.property('files')
			.that.is.an('array')
			.that.contains(filename);
	});
	it('options.filename: included in results.files for css url path if html string and options.verbose true', function () {
		var filename = path.resolve(__dirname, 'fixtures/file.txt');
		var html = `<style>div { background-image: url('${filename}'); }</style>`;
		var options = { verbose: true };
		return expect(inline(html, options)).to.eventually.have.property('files')
			.that.is.an('array')
			.that.contains(filename);
	});


	it('preserve self closing tags', function () {
		var html = '<br/>';
		return expect(inline(html)).to.eventually.equal(html);
	});
	it('preserve partials', function () {
		var html = '{{> partial}}';
		return expect(inline(html)).to.eventually.equal(html);
	});
	it('preserve helpers', function () {
		var html = '{{helper}}';
		return expect(inline(html)).to.eventually.equal(html);
	});

	it('ignore css url remote paths', function () {
		var html = `<style> div { background-image: url('http://test.com/file.txt?query=string#hash'); }</style>`;
		return expect(inline(html)).to.eventually.equal(html);
	});
	it('ignore img src remote paths', function () {
		var html = `<img src="http://test.com/file.txt?query=string#hash"/>`;
		return expect(inline(html)).to.eventually.equal(html);
	});
	it('ignore css url template expression paths', function () {
		var html = `<style> div { background-image: url({{path}}); }</style>`;
		return expect(inline(html)).to.eventually.equal(html);
	});
	it('ignore img src template expression paths', function () {
		var html = `<img src="{{path}}"/>`;
		return expect(inline(html)).to.eventually.equal(html);
	});
	it('ignore query strings and hashes on local paths', function () {
		var filename = path.resolve(__dirname, 'fixtures/file.txt');
		var url = `${filename}?query=string#hash`;
		var uri = datauri(filename);
		var html = (source) => `<style> div { background-image: url('${source}'); }</style>`;
		return expect(inline(html(url))).to.eventually.equal(html(uri));
	});
	it('handle assets with a space in their filename', function () {
		var filename = path.resolve(__dirname, 'fixtures/file space.txt');
		var uri = datauri(filename);
		var html = (source) => `<style> div { background-image: url('${source}'); }</style>`;
		return expect(inline(html(filename))).to.eventually.equal(html(uri));
	});
});
