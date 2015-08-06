# inline-html

Inline local assets referenced in an HTML document.

[![npm](https://img.shields.io/npm/v/inline-html.svg)]()
[![npm](https://img.shields.io/npm/l/inline-html.svg)]()
[![Travis](https://img.shields.io/travis/panosoft/inline-html.svg)]()
[![David](https://img.shields.io/david/panosoft/inline-html.svg)]()
[![npm](https://img.shields.io/npm/dm/inline-html.svg)]()

## Installation

	npm install inline-html

## Usage

This:

	var inlineHtml = require('inline-html');
	inlineHtml('path/to/file.html').then(function (html) {
		...
	});

Turns this:

	<link rel="stylesheet/less" href="main.less"/>
	<style>
		div { background-image: url('path/to/file'); }
	</style>
	<div style="background-image: url('path/to/file');"></div>
	<img src="path/to/file"/>

Into this:

	<style>
		@font-face { src: url('data:...'); }
		div { background-image: url('data:...'); }
	</style>
	<style>
		div { background-image: url('data:...'); }
	</style>
	<div style="background-image: url('data:...');"></div>
	<img src="data:..."/>

Where:

- `main.less`

		@import (inline) 'main.css';
		div { background-image: url('path/to/file'); }

- `main.css`

		@font-face { src: url('path/to/file'); }

## API

### inlineHtml( filename [, options] )

Reads an HTML file and embeds the contents of local assets referenced by the following elements and data types:

- LESS stylesheets - The LESS is compiled and the result is inlined within a `<style>` element.

		<link rel="stylesheet/less" href="main.less"/>  ->  <style>...</style>

- CSS url data types - The reference path is replaced with a datauri. These can be used in linked stylesheets, style elements, and element style attributes.

		url('file.ext')  ->  url('data:...')

- Images - The source path is replaced with a datauri.

		<img src="file.ext"/>  ->  <img src="data:..."/>

Returns a `Promise` that is fulfilled with an `html` string or a `results` object depending on the value of `options.verbose`.

#### Arguments

- `filename` - The filename of the HTML file to be inlined. Relative file paths are resolved relative to the filename directory.
- `options`
	- `less` - An object containing LESS options to pass to the less compiler. Defaults to `{}`.
	- `verbose` - A boolean that determines the promises fulfillment value. Defaults to `false`.
		- `true`: promise is resolved with an instance of `Results`
		- `false`: promise is resolved with `html`

#### Results object

The `Promise` returned by this function is optionally fulfilled with a `results` object that has the following properties:

- `html` - The inlined html
- `files` - An array of filenames of the inlined local assets.
