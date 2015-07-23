var inline = require('../lib/inline-link-less');
var fs = require('fs');
var path = require('path');

var filepath = path.resolve(__dirname, './fixtures/index.html');
var html = fs.readFileSync(filepath, 'utf8');

inline(html, filepath, {})
	.then(console.log)
	.catch(console.error);
