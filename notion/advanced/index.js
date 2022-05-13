/* const normalizedPath = require('path').join(__dirname, 'routes');

console.log(normalizedPath);  */
const x = {};

require('fs').readdirSync(__dirname).forEach((file) => {
  x[file] = require('./' + file);
  exports[file.replace('.js', '')] = x[file];
});

/*
require("fs").readdirSync().forEach(function(file) {
  require("./routes/" + file);
}); */

