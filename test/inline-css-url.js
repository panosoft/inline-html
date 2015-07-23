var inline = require('../lib/inline-css-url');
var fs = require('fs');

var filePath = './fixtures/assets/imported.css';
var css = fs.readFileSync(filePath, 'utf8');
css = inline(css, filePath);
console.log(css);
