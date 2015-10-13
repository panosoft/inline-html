# inline-html

Inline local assets referenced in an HTML document.

[![npm version](https://img.shields.io/npm/v/inline-html.svg)](https://www.npmjs.com/package/inline-html)
[![npm license](https://img.shields.io/npm/l/inline-html.svg)](https://www.npmjs.com/package/inline-html)
[![Travis](https://img.shields.io/travis/panosoft/inline-html.svg)](https://travis-ci.org/panosoft/inline-html)
[![David](https://img.shields.io/david/panosoft/inline-html.svg)](https://david-dm.org/panosoft/inline-html)
[![npm downloads](https://img.shields.io/npm/dm/inline-html.svg)](https://www.npmjs.com/package/inline-html)

This library parses HTML, embeds the contents of local assets that are referenced within that HTML, and returns a new inlined HTML string.

The following HTML elements and CSS data types are inlined:

- Images - The source path is replaced with a datauri.

- Linked LESS stylesheets - The LESS is compiled and the result is inlined within a `<style>` element. Note that `@imports` are processed as well.

- CSS url data types - The reference path is replaced with a datauri. These can be used in linked stylesheets, style elements, and element style attributes.

## Usage

Assuming ...

- `main.less`

	```css
	@import (less) 'main.css';
	div { background-image: url('path/to/file'); }
	```

- `main.css`

	```css
	@font-face { src: url('path/to/file'); }
	```

Then ...

```js
var co = require('co');
var inline = require('inline-html');

co(function * () {
	var html = `
		<link rel="stylesheet/less" href="main.less"/>
		<style> div { background-image: url('path/to/file'); } </style>
		<div style="background-image: url('path/to/file');"></div>
		<img src="path/to/file"/>
	`;
	html = yield inline.html(html);
	console.log(html);
	/**
		<style>
			@font-face { src: url('data:...'); }
			div { background-image: url('data:...'); }
		</style>
		<style> div { background-image: url('data:...'); } </style>
		<div style="background-image: url('data:...');"></div>
		<img src="data:..."/>
	 */
});
```

## Installation

```sh
npm install inline-html
```

## API

- [`inline.html`](#html)
- [`inline.file`](#file)
- [`Results`](#results)

---

<a name="html"/>
### inline.html ( html [, options] )

Parses an HTML string and embeds referenced local assets into the HTML.

Returns a `Promise` that is fulfilled with an `html` string or an instance of [`Results`](#results) depending on the value of `options.verbose`.

__Arguments__

- `html` - An HTML string to inline.


- `options`
	- `filename` - The filename used to resolve relative paths. If this option is not provided, relative paths will be resolved relative to the process's current working directory.
	- `less` - An object containing LESS options to pass to the less compiler. Defaults to `{}`.
	- `verbose` - A boolean that determines the promises fulfillment value. Supported values are:
		- `true`: An instance of [`Results`](#results).
		- `false`: An `html` string. (_Default_)

__Example__

```js
co(function * () {
	var html = yield inline.html(`<img src="test.png">`);
	console.log(html); // <img src="data:...">
});
```

---

<a name="file"/>
### inline.file ( filename [, options] )

Reads an HTML file and embeds referenced local assets into the HTML.

Returns a `Promise` that is fulfilled with an `html` string or an instance of [`Results`](#results) depending on the value of `options.verbose`.

__Arguments__

- `html` - A filename of an HTML file to inline. Relative file paths are resolved relative to the filename's directory.


- `options`
	- `less` - An object containing LESS options to pass to the less compiler. Defaults to `{}`.
	- `verbose` - A boolean that determines the promises fulfillment value. Supported values are:
		- `true`: An instance of [`Results`](#results).
		- `false`: An `html` string. (_Default_)

__Example__

```js
co(function * () {
	html = yield inline.file(`index.html`);
	console.log(html); // <img src="data:...">
});
```

---

<a name="results"/>
### Results

The `Promise` returned by these functions is optionally fulfilled with a `results` object that has the following properties:

- `html` - The inlined html
- `files` - An array of filenames for the local assets that were inlined.
