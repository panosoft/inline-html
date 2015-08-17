# inline-html

Inline local assets referenced in an HTML document.

[![npm version](https://img.shields.io/npm/v/inline-html.svg)](https://www.npmjs.com/package/inline-html)
[![npm license](https://img.shields.io/npm/l/inline-html.svg)](https://www.npmjs.com/package/inline-html)
[![Travis](https://img.shields.io/travis/panosoft/inline-html.svg)](https://travis-ci.org/panosoft/inline-html)
[![David](https://img.shields.io/david/panosoft/inline-html.svg)](https://david-dm.org/panosoft/inline-html)
[![npm downloads](https://img.shields.io/npm/dm/inline-html.svg)](https://www.npmjs.com/package/inline-html)

## Installation

```sh
npm install inline-html
```

## Usage

Reads an HTML file, embeds the contents of local assets that are referenced within that file, and returns the inlined `html` string.

The following elements and data types are inlined:

- LESS stylesheets - The LESS is compiled and the result is inlined within a `<style>` element.
- CSS url data types - The reference path is replaced with a datauri. These can be used in linked stylesheets, style elements, and element style attributes.
- Images - The source path is replaced with a datauri.

Assuming we have the following files:

- `index.html`

	```html
	<link rel="stylesheet/less" href="main.less"/>
	<style>
		div { background-image: url('path/to/file'); }
	</style>
	<div style="background-image: url('path/to/file');"></div>
	<img src="path/to/file"/>
	```

- `main.less`

	```css
	@import (inline) 'main.css';
	div { background-image: url('path/to/file'); }
	```

- `main.css`

	```css
	@font-face { src: url('path/to/file'); }
	```

We can use `inline-html`:

```js
var inlineHtml = require('inline-html');

inlineHtml('index.html').then(function (html) {
	// ...
});
```

To create the following `html` string:

```html
<style>
	@font-face { src: url('data:...'); }
	div { background-image: url('data:...'); }
</style>
<style>
	div { background-image: url('data:...'); }
</style>
<div style="background-image: url('data:...');"></div>
<img src="data:..."/>
```

## API

- [`inlineHtml`](#inlineHtml)

---

<a name="inlineHtml"/>
### inlineHtml ( filename [, options] )

Reads an HTML file and embeds referenced local assets into the HTML.

Returns a `Promise` that is fulfilled with an `html` string or an instance of [`Results`](#Results) depending on the value of `options.verbose`.

__Arguments__

- `filename` - The filename of the HTML file to be inlined. Relative file paths are resolved relative to the filename directory.
- `options`
	- `less` - An object containing LESS options to pass to the less compiler. Defaults to `{}`.
	- `verbose` - A boolean that determines the promises fulfillment value. Supported values are:
		- `true`: An instance of [`Results`](#Results).
		- `false`: An `html` string. (_default_)

<a name="Results"/>
__Results__

The `Promise` returned by this function is optionally fulfilled with a `results` object that has the following properties:

- `html` - The inlined html
- `files` - An array of filenames for the local assets that were inlined.
