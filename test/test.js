var path = require('path');
var NagiosParser = require('../lib/parser.js');

var opts = {
  'files': {
    'status': path.join(__dirname, 'example/status.dat')
  }
};
var parser = new NagiosParser(opts);

parser.readFile('status', function(err, cb) {
  console.log(err, cb);
});
