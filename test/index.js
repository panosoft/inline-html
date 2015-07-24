var inline = require('../lib');
var path = require('path');
var fs = require('fs');

var filepath = path.resolve(__dirname, './fixtures/index.html');
var options = {verbose: true};

inline(filepath, options)
	.then(function (html) {
		console.log(html);
		fs.writeFileSync('./test.html', html);
	})
	.catch(console.error);
